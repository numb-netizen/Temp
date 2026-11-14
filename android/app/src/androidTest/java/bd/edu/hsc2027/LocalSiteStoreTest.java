package bd.edu.hsc2027;

import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class LocalSiteStoreTest {
    @Test public void updateIsCompleteVerifiedAndOnlyActivatedByUser() throws Exception {
        Context base = InstrumentationRegistry.getInstrumentation().getTargetContext();
        String id = UUID.randomUUID().toString();
        File root = new File(base.getCacheDir(), "offline-test-" + id);
        assertTrue(root.mkdirs());
        Context isolated = new ContextWrapper(base) {
            @Override public File getFilesDir() { return root; }
            @Override public SharedPreferences getSharedPreferences(String name, int mode) {
                return base.getSharedPreferences("test-" + id + "-" + name, mode);
            }
        };
        try {
            Map<String, byte[]> remote = new HashMap<>();
            remote.put("index.html", bytes("new home"));
            remote.put("assets/style.css", bytes("new css"));
            remote.put("assets/app.js", bytes("new js"));
            remote.put("offline-manifest.json", createManifest(remote));
            LocalSiteStore.Source source = path -> {
                byte[] value = remote.get(path);
                if (value == null) throw new IOException("offline");
                return new ByteArrayInputStream(value);
            };
            LocalSiteStore store = new LocalSiteStore(isolated, source);
            String original = read(store.response("/", "GET").getData());
            assertTrue("Fresh install should contain the bundled homepage", original.contains("HSC 2027"));
            assertEquals(404, store.response("/../index.html", "GET").getStatusCode());
            File staged = store.checkForUpdate(); assertNotNull(staged);
            assertEquals("Staging must not interrupt current content", original, read(store.response("/", "GET").getData()));
            store.activate(staged);
            assertEquals("new home", read(store.response("/", "GET").getData()));
            assertEquals("Bundled resources remain available", 200, store.response("/routine.html", "GET").getStatusCode());
            LocalSiteStore reloaded = new LocalSiteStore(isolated, source);
            assertEquals("Activated update survives restart", "new home", read(reloaded.response("/", "GET").getData()));
            assertNull("Identical update must not prompt repeatedly", reloaded.checkForUpdate());
            remote.put("index.html", bytes("second home"));
            remote.put("offline-manifest.json", createManifest(remote));
            remote.put("index.html", bytes("tampered content"));
            try { reloaded.checkForUpdate(); fail("Tampered download accepted"); }
            catch (IOException expected) { }
            assertEquals("Failed update must not replace good snapshot", "new home", read(reloaded.response("/", "GET").getData()));
            remote.clear();
            try { reloaded.checkForUpdate(); fail("Missing network accepted"); }
            catch (IOException expected) { }
            assertEquals("Offline snapshot remains usable", "new home", read(reloaded.response("/", "GET").getData()));
        } finally { delete(root); }
    }
    private static byte[] createManifest(Map<String, byte[]> files) throws Exception {
        JSONArray entries = new JSONArray();
        for (String path : new String[]{"index.html", "assets/style.css", "assets/app.js"}) {
            byte[] data = files.get(path);
            entries.put(new JSONObject().put("path", path).put("size", data.length)
                    .put("sha256", OfflineManifest.hex(OfflineManifest.sha256().digest(data))));
        }
        return bytes(new JSONObject().put("version", 1).put("files", entries).toString());
    }
    private static byte[] bytes(String s) { return s.getBytes(StandardCharsets.UTF_8); }
    private static String read(InputStream in) throws IOException {
        try (InputStream input = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096]; int n;
            while ((n = input.read(buf)) != -1) out.write(buf, 0, n);
            return out.toString("UTF-8");
        }
    }
    private static void delete(File file) {
        File[] children = file.listFiles(); if (children != null) for (File child : children) delete(child); file.delete();
    }
}
