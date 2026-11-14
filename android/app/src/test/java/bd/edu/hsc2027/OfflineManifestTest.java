package bd.edu.hsc2027;

import org.json.JSONException;
import org.junit.Test;
import java.nio.charset.StandardCharsets;
import static org.junit.Assert.*;

public class OfflineManifestTest {
    private static final String HASH = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private static String item(String path, long size) { return "{\"path\":\"" + path + "\",\"size\":" + size + ",\"sha256\":\"" + HASH + "\"}"; }
    private static byte[] manifest(String extra) {
        String json = "{\"version\":1,\"files\":[" + item("index.html", 4) + "," + item("assets/style.css", 5) + "," + item("assets/app.js", 6) + extra + "]}";
        return json.getBytes(StandardCharsets.UTF_8);
    }
    @Test public void acceptsSafeManifest() throws Exception {
        OfflineManifest parsed = OfflineManifest.parse(manifest("," + item("assets/logo.png", 8)));
        assertEquals(4, parsed.entries.size()); assertEquals(64, parsed.revision.length());
    }
    @Test public void rejectsTraversalHiddenFilesAndUnsupportedPaths() {
        assertFalse(OfflineManifest.safePath("../index.html"));
        assertFalse(OfflineManifest.safePath("assets/../../index.html"));
        assertFalse(OfflineManifest.safePath("/index.html"));
        assertFalse(OfflineManifest.safePath("assets/.secret.js"));
        assertFalse(OfflineManifest.safePath("assets/file.json"));
        assertFalse(OfflineManifest.safePath("assets/one//two.js"));
        assertTrue(OfflineManifest.safePath("assets/style.css"));
    }
    @Test public void rejectsDuplicateUnsafeAndOversizedEntries() throws Exception {
        for (String extra : new String[]{"," + item("index.html", 1), "," + item("../evil.js", 1), "," + item("assets/huge.js", OfflineManifest.MAX_FILE + 1)}) {
            try { OfflineManifest.parse(manifest(extra)); fail("Invalid entry accepted: " + extra); }
            catch (JSONException expected) { }
        }
    }
    @Test public void rejectsMissingEssentialFilesAndBadHash() throws Exception {
        for (String json : new String[]{"{\"version\":1,\"files\":[" + item("index.html", 1) + "]}",
                new String(manifest(""), StandardCharsets.UTF_8).replace(HASH, "not-a-hash")}) {
            try { OfflineManifest.parse(json.getBytes(StandardCharsets.UTF_8)); fail("Invalid manifest accepted"); }
            catch (JSONException expected) { }
        }
    }
}
