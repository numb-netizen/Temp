package bd.edu.hsc2027;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class AppUserAgentTest {
    @Test public void preservesTheWebViewAgentAndAddsTheAppMarker() {
        assertEquals("Mozilla/5.0 (Linux; Android 13; wv) HSC2027App",
                AppUserAgent.withMarker("Mozilla/5.0 (Linux; Android 13; wv)"));
    }
}
