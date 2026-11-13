package bd.edu.hsc2027;

import android.app.Instrumentation;
import android.content.Intent;
import android.os.SystemClock;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
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

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
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
            instrumentation.runOnMainSync(() -> assertTrue("App marker missing from WebView user agent",
                    web.getSettings().getUserAgentString().contains("HSC2027App")));
            assertPage(instrumentation, web, overlay, detail, "হোম");
            // Use a fresh URL to avoid a previously cached copy of the live HTML.
            instrumentation.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "dabi.html?appcheck=1.2"));
            assertPage(instrumentation, web, overlay, detail, "আমাদের দাবি");
            assertAppDownloadLinksHidden(instrumentation, web);
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
            });
        } finally { instrumentation.runOnMainSync(activity::finish); }
    }

    private static void assertAppDownloadLinksHidden(Instrumentation instrumentation, WebView web) {
        CountDownLatch completed = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>("no response");
        String check = "(() => { const links = [...document.querySelectorAll('nav a[href=\"android-app.html\"], footer a[href=\"android-app.html\"]')]; "
                + "return document.documentElement.classList.contains('hsc-android-app') && links.length === 2 "
                + "&& links.every(link => getComputedStyle(link).display === 'none'); })()";
        instrumentation.runOnMainSync(() -> web.evaluateJavascript(check, value -> {
            result.set(value);
            completed.countDown();
        }));
        try { assertTrue("Timed out checking app navigation", completed.await(15, TimeUnit.SECONDS)); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); fail("Interrupted checking navigation"); }
        assertEquals("Live site should hide app download links inside the HSC app", "true", result.get());
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
