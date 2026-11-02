package app.hie.jupiter;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Jupiter for Android. The screens (HTML/CSS/JS) are bundled inside the APK and served from assets,
 * so the UI opens instantly and works offline. Your account, library and music still come from your
 * Jupiter server (BuildConfig.BASE_URL); when there is no connection the app shows a network-error screen.
 */
public class MainActivity extends Activity {
    private static final int REQ_FILE = 17;
    private static final String BG = "#121212";

    private WebView web;
    private ValueCallback<Uri[]> chooser;
    private String baseHost;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        baseHost = Uri.parse(BuildConfig.BASE_URL).getHost();

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor(BG));
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true); // localStorage + IndexedDB (offline downloads)
        s.setMediaPlaybackRequiresUserGesture(false); // next track starts by itself
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setTextZoom(100);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setUserAgentString(s.getUserAgentString() + " JupiterApp/1");
        CookieManager.getInstance().setAcceptCookie(true);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return bundled(request);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                String scheme = u.getScheme();
                if ("blob".equals(scheme) || "data".equals(scheme) || "about".equals(scheme) || "javascript".equals(scheme)) return false;
                if (u.getHost() != null && u.getHost().equals(baseHost)) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, android.webkit.WebResourceError error) {
                // Only the page itself (the in-app screens are local, so this is rare). API failures are handled inside the app.
                if (request.isForMainFrame()) showNetworkError();
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView w, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null);
                chooser = callback;
                try {
                    startActivityForResult(params.createIntent(), REQ_FILE);
                } catch (Exception e) {
                    chooser = null;
                    return false;
                }
                return true;
            }
        });

        if (saved != null) web.restoreState(saved);
        else web.loadUrl(BuildConfig.BASE_URL + getString(R.string.app_path));
    }

    /** Serves the app's own files (/apps/jupiter/* and /shared/*) from the APK. Everything else goes to the network. */
    private WebResourceResponse bundled(WebResourceRequest request) {
        Uri u = request.getUrl();
        if (!"GET".equals(request.getMethod()) || u.getHost() == null || !u.getHost().equals(baseHost)) return null;
        String p = u.getPath() == null ? "" : u.getPath();
        String asset;
        if (p.equals("/") || p.equals("/apps/jupiter") || p.equals("/apps/jupiter/")) asset = "apps/jupiter/index.html";
        else if (p.startsWith("/apps/jupiter/") || p.startsWith("/shared/")) asset = p.substring(1);
        else return null;
        if (asset.contains("..")) return null;
        try {
            InputStream in = getAssets().open(asset);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mime(asset), "utf-8", 200, "OK", headers, in);
        } catch (IOException e) {
            return null; // not bundled: let it load from the server
        }
    }

    private static String mime(String f) {
        String x = f.substring(f.lastIndexOf('.') + 1).toLowerCase();
        switch (x) {
            case "html": return "text/html";
            case "js": return "text/javascript";
            case "css": return "text/css";
            case "json": case "webmanifest": return "application/json";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            case "woff2": return "font/woff2";
            default: return "application/octet-stream";
        }
    }

    private void showNetworkError() {
        String html = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
            + "<body style='margin:0;background:#121212;color:#F2F2F2;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;text-align:center;padding:24px;box-sizing:border-box'>"
            + "<div style='width:88px;height:88px;border-radius:50%;background:#ED6627;margin-bottom:24px'></div>"
            + "<h2 style='margin:0 0 8px'>No connection</h2><p style='color:#a7a7b0;margin:0 0 24px'>Check your network and try again.</p>"
            + "<a href='" + BuildConfig.BASE_URL + getString(R.string.app_path) + "' style='background:#ED6627;color:#fff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:14px'>Try again</a>"
            + "<p style='position:absolute;bottom:20px;color:#6f6f78;font-size:12px'>Built by Hie</p>";
        web.loadDataWithBaseURL(null, html, "text/html", "utf-8", null);
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == REQ_FILE) {
            if (chooser != null) {
                chooser.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(res, data));
                chooser = null;
            }
            return;
        }
        super.onActivityResult(req, res, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        // Deliberately NOT calling web.onPause(): keeps audio playing with the screen off.
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
