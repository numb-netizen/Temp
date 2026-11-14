package bd.edu.hsc2027;

import android.content.Context;
import android.content.res.AssetManager;
import android.util.AtomicFile;
import android.webkit.WebResourceResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.Locale;
import java.util.UUID;

/** Bundled site plus atomically staged, integrity-checked HTTPS updates. */
final class LocalSiteStore {
    private static final String HOME = NavigationPolicy.HOME;
    private static final int MAX_MANIFEST = 512 * 1024;
    interface Source { InputStream open(String path) throws IOException; }
    private final AssetManager assets;
    private final Source source;
    private final File root;
    private final AtomicFile pointer;
    private volatile File active;

    LocalSiteStore(Context context) { this(context, LocalSiteStore::openRemote); }

    LocalSiteStore(Context context, Source source) {
        assets = context.getAssets();
        this.source = source;
        root = new File(context.getFilesDir(), "site-snapshots");
        root.mkdirs();
        pointer = new AtomicFile(new File(root, "active"));
        // Do not let a snapshot from an older APK silently replace its bundled content.
        int version;
        try { version = context.getPackageManager().getPackageInfo(context.getPackageName(), 0).versionCode; }
        catch (Exception e) { version = -1; }
        android.content.SharedPreferences prefs = context.getSharedPreferences("offline-site", Context.MODE_PRIVATE);
        if (prefs.getInt("apk-version", -1) != version) {
            pointer.delete();
            prefs.edit().putInt("apk-version", version).apply();
        }
        try (InputStream input = pointer.openRead()) {
            String revision = new String(readBounded(input, 128), StandardCharsets.UTF_8).trim();
            if (revision.matches("[a-f0-9]{64}")) {
                File candidate = new File(root, revision);
                if (new File(candidate, ".complete").isFile()) active = candidate;
            }
        } catch (IOException ignored) { }
    }

    WebResourceResponse response(String rawPath, String method) {
        String path = rawPath == null || rawPath.equals("/") ? "index.html" : rawPath.startsWith("/") ? rawPath.substring(1) : rawPath;
        if (!"GET".equals(method) || !OfflineManifest.safePath(path)) return notFound();
        try {
            File snapshot = active;
            InputStream stream;
            File local = snapshot == null ? null : new File(snapshot, path);
            if (local != null && local.isFile()) stream = new FileInputStream(local);
            else stream = assets.open(path);
            String mime = mime(path);
            String encoding = (mime.startsWith("text/") || mime.equals("application/javascript") || mime.equals("image/svg+xml")) ? "UTF-8" : null;
            return new WebResourceResponse(mime, encoding, 200, "OK", Collections.singletonMap("Cache-Control", "no-store"), stream);
        } catch (IOException e) { return notFound(); }
    }

    /** Called on a background thread. Returns a complete staged snapshot, or null. */
    File checkForUpdate() throws Exception {
        byte[] manifestBytes;
        try (InputStream in = source.open("offline-manifest.json")) { manifestBytes = readBounded(in, MAX_MANIFEST); }
        OfflineManifest manifest = OfflineManifest.parse(manifestBytes);
        File current = active;
        if (current != null && current.getName().equals(manifest.revision)) return null;
        if (matches(current, manifest)) return null;
        File finalDir = new File(root, manifest.revision);
        if (new File(finalDir, ".complete").isFile() && matches(finalDir, manifest)) return finalDir;
        File stage = new File(root, "tmp-" + UUID.randomUUID());
        if (!stage.mkdirs()) throw new IOException("Cannot create staging directory");
        boolean done = false;
        try {
            for (OfflineManifest.Entry entry : manifest.entries) {
                File file = new File(stage, entry.path);
                File parent = file.getParentFile();
                if (!parent.isDirectory() && !parent.mkdirs()) throw new IOException("Cannot create directory");
                downloadFile(entry.path, file, entry);
            }
            if (!new File(stage, ".complete").createNewFile()) throw new IOException("Cannot finish update");
            if (finalDir.exists()) deleteTree(finalDir);
            if (!stage.renameTo(finalDir)) throw new IOException("Cannot stage update");
            done = true;
            return finalDir;
        } finally { if (!done) deleteTree(stage); }
    }

    void activate(File snapshot) throws IOException {
        if (snapshot == null || !snapshot.getParentFile().equals(root) || !snapshot.getName().matches("[a-f0-9]{64}") || !new File(snapshot, ".complete").isFile())
            throw new IOException("Invalid update");
        FileOutputStream output = pointer.startWrite();
        try {
            output.write(snapshot.getName().getBytes(StandardCharsets.UTF_8));
            pointer.finishWrite(output);
            active = snapshot;
        } catch (IOException e) { pointer.failWrite(output); throw e; }
    }

    private boolean matches(File snapshot, OfflineManifest manifest) {
        for (OfflineManifest.Entry entry : manifest.entries) {
            try (InputStream input = snapshot == null ? assets.open(entry.path) : new FileInputStream(new File(snapshot, entry.path))) {
                MessageDigest hash = OfflineManifest.sha256();
                byte[] buffer = new byte[8192]; long length = 0; int n;
                while ((n = input.read(buffer)) != -1) { length += n; if (length > entry.size) return false; hash.update(buffer, 0, n); }
                if (length != entry.size || !OfflineManifest.hex(hash.digest()).equals(entry.hash)) return false;
            } catch (IOException e) { return false; }
        }
        return true;
    }

    private static InputStream openRemote(String path) throws IOException {
        HttpURLConnection conn = (HttpURLConnection) new URL(HOME + path).openConnection();
        conn.setInstanceFollowRedirects(false); // Never move update downloads to another origin.
        conn.setConnectTimeout(8000); conn.setReadTimeout(12000);
        conn.setRequestProperty("Cache-Control", "no-cache");
        if (conn.getResponseCode() != 200) { conn.disconnect(); throw new IOException("Update unavailable"); }
        try {
            return new FilterInputStream(conn.getInputStream()) {
                @Override public void close() throws IOException { try { super.close(); } finally { conn.disconnect(); } }
            };
        } catch (IOException e) { conn.disconnect(); throw e; }
    }
    private static byte[] readBounded(InputStream in, int max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192]; int n;
        while ((n = in.read(buf)) != -1) { if (out.size() + n > max) throw new IOException("Too large"); out.write(buf, 0, n); }
        return out.toByteArray();
    }
    private void downloadFile(String path, File destination, OfflineManifest.Entry entry) throws IOException {
        try (InputStream in = source.open(path); FileOutputStream out = new FileOutputStream(destination)) {
            MessageDigest hash = OfflineManifest.sha256(); byte[] buf = new byte[8192]; long length = 0; int n;
            while ((n = in.read(buf)) != -1) {
                length += n; if (length > entry.size) throw new IOException("File exceeds expected size");
                hash.update(buf, 0, n); out.write(buf, 0, n);
            }
            if (length != entry.size || !OfflineManifest.hex(hash.digest()).equals(entry.hash)) throw new IOException("Update checksum mismatch");
        }
    }
    private static void deleteTree(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) deleteTree(child);
        file.delete();
    }
    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", Collections.singletonMap("Cache-Control", "no-store"), new ByteArrayInputStream(new byte[0]));
    }
    private static String mime(String path) {
        String lower = path.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".woff2")) return "font/woff2";
        if (lower.endsWith(".woff")) return "font/woff";
        return "application/octet-stream";
    }
}
