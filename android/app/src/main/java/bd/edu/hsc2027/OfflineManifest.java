package bd.edu.hsc2027;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Validates an update manifest before any files can be written. */
final class OfflineManifest {
    static final long MAX_FILE = 5L * 1024 * 1024;
    static final long MAX_TOTAL = 25L * 1024 * 1024;
    static final int MAX_FILES = 300;
    static final class Entry {
        final String path, hash;
        final long size;
        Entry(String path, String hash, long size) { this.path = path; this.hash = hash; this.size = size; }
    }
    final List<Entry> entries;
    final String revision;
    private OfflineManifest(List<Entry> entries, String revision) { this.entries = entries; this.revision = revision; }

    static OfflineManifest parse(byte[] raw) throws JSONException {
        JSONObject json = new JSONObject(new String(raw, StandardCharsets.UTF_8));
        if (json.getInt("version") != 1) throw new JSONException("Unsupported manifest");
        JSONArray files = json.getJSONArray("files");
        if (files.length() == 0 || files.length() > MAX_FILES) throw new JSONException("Invalid file count");
        List<Entry> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        long total = 0;
        for (int i = 0; i < files.length(); i++) {
            JSONObject item = files.getJSONObject(i);
            String path = item.getString("path"), hash = item.getString("sha256");
            long size = item.getLong("size");
            if (!safePath(path) || !seen.add(path) || !hash.matches("[a-f0-9]{64}") || size < 0 || size > MAX_FILE)
                throw new JSONException("Invalid manifest entry");
            total += size;
            if (total > MAX_TOTAL) throw new JSONException("Update too large");
            result.add(new Entry(path, hash, size));
        }
        if (!seen.contains("index.html") || !seen.contains("assets/style.css") || !seen.contains("assets/app.js"))
            throw new JSONException("Missing required files");
        return new OfflineManifest(result, hex(sha256().digest(raw)));
    }
    static boolean safePath(String path) {
        if (path == null || path.isEmpty() || path.length() > 200 || !path.matches("[A-Za-z0-9_./-]+")) return false;
        for (String segment : path.split("/", -1)) if (segment.isEmpty() || segment.startsWith(".")) return false;
        String lower = path.toLowerCase(Locale.ROOT);
        return lower.matches(".*\\.(html|css|js|png|jpe?g|webp|gif|svg|woff2?)$");
    }
    static MessageDigest sha256() {
        try { return MessageDigest.getInstance("SHA-256"); }
        catch (NoSuchAlgorithmException e) { throw new AssertionError(e); }
    }
    static String hex(byte[] bytes) {
        StringBuilder output = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) output.append(String.format(Locale.ROOT, "%02x", b & 0xff));
        return output.toString();
    }
    private OfflineManifest() { throw new AssertionError(); }
}
