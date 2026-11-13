package bd.edu.hsc2027;

/** A non-secret marker for site presentation; never use it for authorization. */
final class AppUserAgent {
    static String withMarker(String original) {
        return original + " HSC2027App";
    }
    private AppUserAgent() { }
}
