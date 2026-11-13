package bd.edu.hsc2027;

import android.app.Instrumentation;
import android.content.Intent;
import android.os.SystemClock;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebResourceError;
import android.webkit.WebViewClient;
import java.util.Collections;
import java.util.Map;
import android.view.View;
import android.webkit.WebView;
import android.widget.TextView;

import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;

import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.Assert.*;

/** Exercises the real public site in an Android WebView (requires network). */
@RunWith(AndroidJUnit4.class)
public class LiveSiteTest {
    @Test public void homeAppealAndServerError() {
        Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();
        Intent intent = new Intent(instrumentation.getTargetContext(), MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        MainActivity activity = (MainActivity) instrumentation.startActivitySync(intent);
        try {
            WebView web = activity.findViewById(android.R.id.content).findViewWithTag("site-webview");
            View overlay = activity.findViewById(android.R.id.content).findViewWithTag("error-overlay");
            TextView detail = activity.findViewById(android.R.id.content).findViewWithTag("error-detail");
            assertNotNull(web); assertNotNull(overlay); assertNotNull(detail);
            assertPage(instrumentation, web, overlay, detail, "হোম");
            instrumentation.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "dabi.html"));
            assertPage(instrumentation, web, overlay, detail, "আমাদের দাবি");
            instrumentation.runOnMainSync(() -> {
                WebViewClient client = web.getWebViewClient();
                WebResourceResponse notFound = new WebResourceResponse("text/html", "UTF-8", 404,
                        "Not Found", Collections.emptyMap(), null);
                client.onReceivedHttpError(web, request(false), notFound);
                assertEquals("Subresource failures must not hide the page", View.GONE, overlay.getVisibility());
                client.onReceivedHttpError(web, request(true), notFound);
                assertEquals(View.VISIBLE, overlay.getVisibility());
                assertTrue(detail.getText().toString().contains("404"));
                client.onPageStarted(web, "about:blank", null);
                assertEquals("Internal browser pages must not hide the error", View.VISIBLE, overlay.getVisibility());
                client.onPageStarted(web, NavigationPolicy.HOME, null);
                assertEquals(View.GONE, overlay.getVisibility());
                client.onReceivedError(web, request(true), new WebResourceError() {
                    @Override public int getErrorCode() { return WebViewClient.ERROR_HOST_LOOKUP; }
                    @Override public CharSequence getDescription() { return "DNS lookup failed"; }
                });
                assertEquals(View.VISIBLE, overlay.getVisibility());
                assertTrue(detail.getText().toString().contains("-2"));
            });
        } finally { instrumentation.runOnMainSync(activity::finish); }
    }

    private static WebResourceRequest request(boolean mainFrame) {
        return new WebResourceRequest() {
            @Override public Uri getUrl() { return Uri.parse(NavigationPolicy.HOME); }
            @Override public boolean isForMainFrame() { return mainFrame; }
            @Override public boolean isRedirect() { return false; }
            @Override public boolean hasGesture() { return false; }
            @Override public String getMethod() { return "GET"; }
            @Override public Map<String, String> getRequestHeaders() { return Collections.emptyMap(); }
        };
    }

    private static void assertPage(Instrumentation instrumentation, WebView web, View overlay,
                                   TextView detail, String expectedTitle) {
        long deadline = SystemClock.elapsedRealtime() + 60000;
        AtomicReference<String> status = new AtomicReference<>("loading");
        while (SystemClock.elapsedRealtime() < deadline) {
            instrumentation.runOnMainSync(() -> {
                if (overlay.getVisibility() == View.VISIBLE) status.set("error: " + detail.getText());
                else if (web.getProgress() == 100 && web.getTitle() != null && web.getTitle().contains(expectedTitle)) {
                    status.set("ok");
                }
            });
            if (status.get().equals("ok") || status.get().startsWith("error:")) break;
            SystemClock.sleep(250);
        }
        assertEquals("WebView did not load " + expectedTitle + ": " + status.get(), "ok", status.get());
    }
}
