import 'dart:io';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class WebViewScreen extends StatefulWidget {
  final String url;
  final String title;

  const WebViewScreen({super.key, required this.url, required this.title});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late final WebViewController _controller;
  int _loadingPercentage = 0;

  BannerAd? _bannerAd;
  bool _isBannerAdLoaded = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() => _loadingPercentage = 0);
          },
          onProgress: (progress) {
            setState(() => _loadingPercentage = progress);
          },
          onPageFinished: (url) {
            setState(() => _loadingPercentage = 100);
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.url));

    _loadBannerAd();
  }

  void _loadBannerAd() {
    _bannerAd = BannerAd(
      adUnitId: Platform.isAndroid
          ? 'ca-app-pub-3940256099942544/6300978111'
          : 'ca-app-pub-3940256099942544/2934735716',
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() {
            _bannerAd = ad as BannerAd;
            _isBannerAdLoaded = true;
          });
        },
        onAdFailedToLoad: (ad, err) {
          debugPrint('Failed to load a banner ad: ${err.message}');
          ad.dispose();
        },
      ),
    )..load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _controller.reload(),
          ),
        ],
      ),
      body: Stack(
        children: [
          Padding(
            padding: EdgeInsets.only(
              bottom: _bannerAd != null ? _bannerAd!.size.height.toDouble() : 0,
            ),
            child: WebViewWidget(controller: _controller),
          ),
          if (_loadingPercentage < 100)
            LinearProgressIndicator(value: _loadingPercentage / 100.0),

          if (_isBannerAdLoaded && _bannerAd != null)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: SizedBox(
                height: _bannerAd!.size.height.toDouble(),
                width: _bannerAd!.size.width.toDouble(),
                child: AdWidget(ad: _bannerAd!),
              ),
            ),
        ],
      ),
      bottomNavigationBar: BottomAppBar(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () async {
                if (await _controller.canGoBack()) {
                  _controller.goBack();
                }
              },
            ),
            IconButton(
              icon: const Icon(Icons.arrow_forward),
              onPressed: () async {
                if (await _controller.canGoForward()) {
                  _controller.goForward();
                }
              },
            ),
            IconButton(
              icon: const Icon(Icons.home),
              onPressed: () => _controller.loadRequest(Uri.parse(widget.url)),
            ),
          ],
        ),
      ),
    );
  }
}
