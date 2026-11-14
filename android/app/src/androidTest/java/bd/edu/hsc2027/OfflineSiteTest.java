package bd.edu.hsc2027;

import android.app.Instrumentation;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.os.SystemClock;
import android.view.View;
import android.webkit.WebView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeTrue;

@RunWith(AndroidJUnit4.class)
public class OfflineSiteTest {
    @Test public void firstLaunchAndStudyFeaturesWorkWithoutNetwork() throws Exception {
        assumeTrue("true".equals(InstrumentationRegistry.getArguments().getString("requireOffline")));
        Instrumentation i = InstrumentationRegistry.getInstrumentation();
        ConnectivityManager cm = (ConnectivityManager) i.getTargetContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkInfo info = cm.getActiveNetworkInfo();
        assertTrue("Emulator must actually be disconnected", info == null || !info.isConnected());
        Intent intent = new Intent(i.getTargetContext(), MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        MainActivity activity = (MainActivity) i.startActivitySync(intent);
        try {
            WebView web = activity.findViewById(android.R.id.content).findViewWithTag("site-webview");
            View overlay = activity.findViewById(android.R.id.content).findViewWithTag("error-overlay");
            assertPage(i, web, overlay, "হোম");
            assertEquals("true", js(i, web, "Boolean(document.querySelector('#cdD') && document.querySelector('#cdD').textContent !== '—')"));
            assertEquals("true", js(i, web, "location.origin === 'https://hsc2027.de5.net'"));
            // Test countdown progression with a fixed time before its target, regardless of the emulator clock.
            assertEquals("true", js(i, web, "(() => { const now=Date.now; try { Date.now=()=>target-10000; tick(); const before=document.querySelector('#cdS').textContent; Date.now=()=>target-11000; tick(); return before !== document.querySelector('#cdS').textContent; } finally { Date.now=now; tick(); } })()"));
            i.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "physics.html"));
            assertPage(i, web, overlay, "পদার্থ");
            i.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "routine.html"));
            assertPage(i, web, overlay, "রুটিন");
            i.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "tracker.html"));
            assertPage(i, web, overlay, "ট্র্যাকার");
            assertEquals("true", js(i, web, "(() => {let el=document.querySelector('.chap'); if(!el)return false; if(!el.classList.contains('done'))el.click(); return el.classList.contains('done')})()"));
            i.runOnMainSync(web::reload);
            SystemClock.sleep(1000); assertPage(i, web, overlay, "ট্র্যাকার");
            assertEquals("true", js(i, web, "document.querySelector('.chap').classList.contains('done')"));
            i.runOnMainSync(() -> web.loadUrl(NavigationPolicy.HOME + "dabi.html"));
            assertPage(i, web, overlay, "আমাদের দাবি");
            long until = SystemClock.elapsedRealtime() + 20000; String status = "";
            while (SystemClock.elapsedRealtime() < until) {
                status = js(i, web, "document.querySelector('#support-message').textContent.includes('লোড করা যায়নি')");
                if (status.equals("true")) break;
                SystemClock.sleep(250);
            }
            assertEquals("Offline public names must not claim success", "true", status);
        } finally { i.runOnMainSync(activity::finish); }
    }
    private static void assertPage(Instrumentation i, WebView web, View overlay, String title) {
        long until = SystemClock.elapsedRealtime() + 60000; AtomicReference<String> state = new AtomicReference<>("loading");
        while (SystemClock.elapsedRealtime() < until) {
            i.runOnMainSync(() -> {
                if (overlay.getVisibility() == View.VISIBLE) state.set("error");
                else if (web.getProgress() == 100 && web.getTitle() != null && web.getTitle().contains(title)) state.set("ok");
            });
            if (!state.get().equals("loading")) break;
            SystemClock.sleep(250);
        }
        assertEquals("Offline page " + title, "ok", state.get());
    }
    private static String js(Instrumentation i, WebView web, String script) throws Exception {
        CountDownLatch done = new CountDownLatch(1); AtomicReference<String> result = new AtomicReference<>("none");
        i.runOnMainSync(() -> web.evaluateJavascript(script, value -> { result.set(value); done.countDown(); }));
        assertTrue(done.await(15, TimeUnit.SECONDS)); return result.get();
    }
}
