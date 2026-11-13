package bd.edu.hsc2027;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private WebView webView;
    private View offline;
    private ProgressBar progress;
    private TextView errorDetail;
    private String retryUrl = NavigationPolicy.HOME;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(7, 27, 16));
        getWindow().setNavigationBarColor(Color.rgb(7, 27, 16));
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(7, 27, 16));
        // Android 15 enforces edge-to-edge for target SDK 35.
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        root.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));
        FrameLayout content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 27, 16));
        webView.setTag("site-webview");
        content.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        offline = createOfflineView();
        offline.setTag("error-overlay");
        content.addView(offline, new FrameLayout.LayoutParams(-1, -1));
        offline.setVisibility(View.GONE);
        setContentView(root);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true); // Required by the study tracker and appeal form.
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false); // target=_blank links route through the same policy.
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value >= 100 ? View.GONE : View.VISIBLE);
            }
        });
        webView.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return false;
                return route(request.getUrl());
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (NavigationPolicy.destination(url) == NavigationPolicy.Destination.INTERNAL) {
                    retryUrl = url;
                    offline.setVisibility(View.GONE);
                }
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    int code = error.getErrorCode();
                    int message = R.string.offline_detail;
                    if (code == ERROR_FAILED_SSL_HANDSHAKE) message = R.string.error_ssl;
                    else if (code == ERROR_HOST_LOOKUP || code == ERROR_CONNECT || code == ERROR_TIMEOUT || code == ERROR_IO) message = R.string.error_connection;
                    showOffline(getString(R.string.error_code, getString(message), code));
                }
            }
            @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse error) {
                if (request.isForMainFrame() && error.getStatusCode() >= 400) {
                    showOffline(getString(R.string.error_http, error.getStatusCode()));
                }
            }
            @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.cancel();
                // A failed third-party asset should not cover an otherwise usable page.
                if (error.getUrl() != null && error.getUrl().equals(view.getUrl())) showOffline(getString(R.string.error_ssl));
            }
        });
        if (state == null || webView.restoreState(state) == null) webView.loadUrl(NavigationPolicy.HOME);
    }

    private boolean route(Uri uri) {
        NavigationPolicy.Destination destination = NavigationPolicy.destination(uri.toString());
        if (destination == NavigationPolicy.Destination.INTERNAL) return false;
        if (destination == NavigationPolicy.Destination.EXTERNAL) {
            openExternal(uri);
        }
        return true;
    }

    private void openExternal(Uri uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE)); }
        catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(this, R.string.no_handler, Toast.LENGTH_LONG).show();
        }
    }

    private View createOfflineView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(dp(24), dp(24), dp(24), dp(24));
        box.setBackgroundColor(Color.rgb(7, 27, 16));
        TextView title = new TextView(this);
        title.setText(R.string.offline_title); title.setTextColor(Color.WHITE);
        title.setTextSize(22); title.setTypeface(null, Typeface.BOLD); title.setGravity(Gravity.CENTER);
        box.addView(title);
        errorDetail = new TextView(this);
        errorDetail.setTag("error-detail");
        errorDetail.setText(R.string.offline_detail); errorDetail.setTextColor(Color.rgb(188, 214, 197));
        errorDetail.setTextSize(16); errorDetail.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams detailParams = new LinearLayout.LayoutParams(-1, -2);
        detailParams.setMargins(0, dp(12), 0, dp(20)); box.addView(errorDetail, detailParams);
        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setOnClickListener(v -> { offline.setVisibility(View.GONE); webView.loadUrl(retryUrl); });
        box.addView(retry);
        Button browser = new Button(this);
        browser.setText(R.string.open_browser);
        browser.setOnClickListener(v -> openExternal(Uri.parse(retryUrl)));
        box.addView(browser);
        return box;
    }

    private void showOffline(String detail) {
        errorDetail.setText(detail);
        progress.setVisibility(View.GONE);
        offline.setVisibility(View.VISIBLE);
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    @Override public void onBackPressed() {
        if (webView.canGoBack()) { offline.setVisibility(View.GONE); webView.goBack(); }
        else super.onBackPressed();
    }
    @Override protected void onSaveInstanceState(Bundle state) {
        webView.saveState(state);
        super.onSaveInstanceState(state);
    }
    @Override protected void onDestroy() {
        webView.destroy();
        super.onDestroy();
    }
}
