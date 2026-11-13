package bd.edu.hsc2027;

import org.junit.Test;
import static org.junit.Assert.assertEquals;

public class NavigationPolicyTest {
    @Test public void siteStaysInsideApp() {
        assertEquals(NavigationPolicy.Destination.INTERNAL, NavigationPolicy.destination(NavigationPolicy.HOME));
        assertEquals(NavigationPolicy.Destination.INTERNAL, NavigationPolicy.destination("https://HSC2027.DE5.NET:443/dabi.html#support"));
    }
    @Test public void externalLinksOpenOutside() {
        assertEquals(NavigationPolicy.Destination.EXTERNAL, NavigationPolicy.destination("https://wa.me/8801974500165"));
        assertEquals(NavigationPolicy.Destination.EXTERNAL, NavigationPolicy.destination("https://www.youtube.com/results?search_query=HSC"));
        assertEquals(NavigationPolicy.Destination.EXTERNAL, NavigationPolicy.destination("https://hsc2027.de5.net.evil.example/"));
        assertEquals(NavigationPolicy.Destination.EXTERNAL, NavigationPolicy.destination("http://hsc2027.de5.net/"));
        assertEquals(NavigationPolicy.Destination.EXTERNAL, NavigationPolicy.destination("tel:+8801974500165"));
    }
    @Test public void dangerousAndMalformedSchemesAreBlocked() {
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destination("javascript:alert(1)"));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destination("file:///etc/passwd"));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destination("intent://example"));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destination("https://hsc2027.de5.net@evil.example/"));
        assertEquals(NavigationPolicy.Destination.BLOCKED, NavigationPolicy.destination(null));
    }
}
