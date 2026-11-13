package bd.edu.hsc2027;

import android.app.Instrumentation;
import android.content.Intent;
import android.os.SystemClock;
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
            instrumentation.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "__android_test_missing_page__.html"));
            long deadline = SystemClock.elapsedRealtime() + 60000;
            AtomicReference<String> result = new AtomicReference<>("");
            while (SystemClock.elapsedRealtime() < deadline) {
                instrumentation.runOnMainSync(() -> {
                    if (overlay.getVisibility() == View.VISIBLE) result.set(detail.getText().toString());
                });
                if (!result.get().isEmpty()) break;
                SystemClock.sleep(250);
            }
            assertTrue("Expected HTTP 404 message, got: " + result.get(), result.get().contains("404"));
        } finally { instrumentation.runOnMainSync(activity::finish); }
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
