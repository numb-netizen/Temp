package bd.edu.hsc2027;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;

/** Only the HTTPS site runs inside the JavaScript-enabled WebView. */
final class NavigationPolicy {
    static final String HOME = "https://hsc2027.de5.net/";
    enum Destination { INTERNAL, EXTERNAL, BLOCKED }

    static Destination destination(String value) {
        if (value == null) return Destination.BLOCKED;
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (scheme == null) return Destination.BLOCKED;
            scheme = scheme.toLowerCase(Locale.ROOT);
            String host = uri.getHost();
            if ("https".equals(scheme) && host != null
                    && "hsc2027.de5.net".equalsIgnoreCase(host)
                    && uri.getUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443)) {
                return Destination.INTERNAL;
            }
            if (("https".equals(scheme) || "http".equals(scheme)) && host != null && uri.getUserInfo() == null) {
                return Destination.EXTERNAL;
            }
            if ("mailto".equals(scheme) || "tel".equals(scheme) || "sms".equals(scheme)) {
                return Destination.EXTERNAL;
            }
        } catch (URISyntaxException ignored) { }
        return Destination.BLOCKED;
    }

    private NavigationPolicy() { }
}
