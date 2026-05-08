import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import '../../core/services/ads_service.dart';

/// Reusable Native Ad Widget
/// Currently using banner ads as fallback until native ad factories are set up
/// TODO: Switch to native ads once Android/iOS factories are implemented
class NativeAdWidget extends ConsumerStatefulWidget {
  final double height;
  final EdgeInsets padding;

  const NativeAdWidget({
    super.key,
    this.height = 320,
    this.padding = const EdgeInsets.symmetric(vertical: 16),
  });

  @override
  ConsumerState<NativeAdWidget> createState() => _NativeAdWidgetState();
}

class _NativeAdWidgetState extends ConsumerState<NativeAdWidget>
    with AutomaticKeepAliveClientMixin {
  BannerAd? _bannerAd;
  bool _isLoaded = false;

  @override
  bool get wantKeepAlive => true; // Keep the ad alive when scrolling

  @override
  void initState() {
    super.initState();
    _loadAd();
  }

  void _loadAd() {
    final adsService = ref.read(adsServiceProvider);
    // Using large banner as temporary replacement for native ad
    _bannerAd = adsService.createBannerAd(
      size: AdSize.mediumRectangle, // 300x250
      onAdLoaded: (ad) {
        if (mounted) {
          setState(() => _isLoaded = true);
        }
      },
      onAdFailedToLoad: (ad, error) {
        debugPrint('Banner ad failed to load: $error');
        if (mounted) {
          setState(() => _isLoaded = false);
        }
      },
    );
  }

  @override
  void dispose() {
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(
      context,
    ); // IMPORTANT: Call super when using AutomaticKeepAliveClientMixin

    // Temporarily disabled ads
    return const SizedBox.shrink();

    // Don't show anything if not loaded or if ad creation failed
    if (!_isLoaded || _bannerAd == null) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: widget.padding,
      child: Container(
        height: _bannerAd!.size.height.toDouble(),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withOpacity(0.2)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AdWidget(ad: _bannerAd!),
        ),
      ),
    );
  }
}
