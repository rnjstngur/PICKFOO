package com.pickfoo.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

/** External shop links only. No shopping cart or purchase integration. */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (bridge == null || bridge.getWebView() == null) return;
        bridge.getWebView().setWebViewClient(new BridgeWebViewClient(bridge) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme();
                String host = uri.getHost();
                if (host != null && ("https".equals(scheme) || "http".equals(scheme))) {
                    String packageId = null;
                    if (host.equals("www.baemin.com") || host.equals("baemin.com")) packageId="com.sampleapp";
                    else if (host.equals("www.coupangeats.com") || host.equals("coupangeats.com")) packageId="com.coupang.mobile.eats";
                    else if (host.equals("www.gsretail.com") || host.equals("gsretail.com")) packageId="com.gsr.gs25";
                    else if (host.equals("cu.bgfretail.com")) packageId="com.bgfcu.membership";
                    if (packageId != null) {
                        // Other apps may not be installed: fall back to the public website.
                        if (launchShop(packageId, uri)) return true;
                    }
                }
                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }

    private boolean launchShop(String packageId, Uri fallback) {
        try {
            Intent app = getPackageManager().getLaunchIntentForPackage(packageId);
            if (app != null) { startActivity(app); return true; }
        } catch (Exception ignored) { }
        try {
            Intent browser = new Intent(Intent.ACTION_VIEW, fallback);
            startActivity(browser);
            return true;
        } catch (ActivityNotFoundException ignored) {
            return false;
        }
    }
}
