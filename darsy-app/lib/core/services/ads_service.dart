import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:darsy/presentation/providers/preferences_provider.dart';
import 'package:darsy/presentation/providers/auth_provider.dart';

final adsServiceProvider = Provider<AdsService>((ref) => AdsService(ref));

class AdsService {
  final Ref _ref;

  // Ad instances
  InterstitialAd? _interstitialAd;
  RewardedAd? _rewardedAd;

  // Load attempt counters
  int _numInterstitialLoadAttempts = 0;
  int _numRewardedLoadAttempts = 0;

  // Maximum retry attempts
  static const int _maxAttempts = 5;

  // Test Ad Unit IDs
  final String _interstitialAdUnitId = Platform.isAndroid
      ? 'ca-app-pub-3940256099942544/1033173712'
      : 'ca-app-pub-3940256099942544/4411468910';

  final String _rewardedAdUnitId = Platform.isAndroid
      ? 'ca-app-pub-3940256099942544/5224354917'
      : 'ca-app-pub-3940256099942544/1712485313';

  final String _nativeAdUnitId = Platform.isAndroid
      ? 'ca-app-pub-3940256099942544/2247696110'
      : 'ca-app-pub-3940256099942544/3986624511';

  final String _bannerAdUnitId = Platform.isAndroid
      ? 'ca-app-pub-3940256099942544/6300978111'
      : 'ca-app-pub-3940256099942544/2934735716';

  AdsService(this._ref);

  // Public getters for ad unit IDs
  String get nativeAdUnitId => _nativeAdUnitId;
  String get bannerAdUnitId => _bannerAdUnitId;

  bool get _canShowAds {
    final prefs = _ref.read(preferencesProvider);
    final authState = _ref.read(authProvider);

    // Disable if user turned them off
    if (!prefs.isAdsEnabled()) return false;

    // Disable for premium users
    if (authState.user?.subscription?.isPremium == true) return false;

    return true;
  }

  /// Initialize the Mobile Ads SDK and pre-load ads
  Future<void> initialize() async {
    debugPrint('🎯 Initializing Google Mobile Ads...');
    await MobileAds.instance.initialize();
    debugPrint('✅ Google Mobile Ads initialized');

    if (_canShowAds) {
      _loadInterstitialAd();
      _loadRewardedAd();
    }
  }

  // ============================================================================
  // INTERSTITIAL ADS
  // ============================================================================

  bool get isInterstitialAdReady => _interstitialAd != null;
  Completer<bool>? _interstitialAdLoadCompleter;

  Future<bool> loadInterstitialAd() async {
    if (isInterstitialAdReady) return true;
    if (!_canShowAds) return false;

    if (_interstitialAdLoadCompleter != null &&
        !_interstitialAdLoadCompleter!.isCompleted) {
      return _interstitialAdLoadCompleter!.future;
    }

    _interstitialAdLoadCompleter = Completer<bool>();

    InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (InterstitialAd ad) {
          debugPrint('✅ InterstitialAd loaded successfully');
          _interstitialAd = ad;
          _numInterstitialLoadAttempts = 0;
          _interstitialAd!.setImmersiveMode(true);
          _interstitialAdLoadCompleter?.complete(true);
        },
        onAdFailedToLoad: (LoadAdError error) {
          debugPrint('❌ InterstitialAd failed to load: $error');
          _numInterstitialLoadAttempts += 1;
          _interstitialAd = null;
          _interstitialAdLoadCompleter?.complete(false);
        },
      ),
    );

    return _interstitialAdLoadCompleter!.future;
  }

  void _loadInterstitialAd() {
    if (!_canShowAds) return;
    InterstitialAd.load(
      adUnitId: _interstitialAdUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (InterstitialAd ad) {
          _interstitialAd = ad;
          _numInterstitialLoadAttempts = 0;
          _interstitialAd!.setImmersiveMode(true);
        },
        onAdFailedToLoad: (LoadAdError error) {
          _numInterstitialLoadAttempts += 1;
          _interstitialAd = null;
          if (_numInterstitialLoadAttempts < _maxAttempts) {
            final delay = _numInterstitialLoadAttempts * 2;
            Future.delayed(Duration(seconds: delay), _loadInterstitialAd);
          }
        },
      ),
    );
  }

  bool showInterstitialAd({VoidCallback? onAdDismissed}) {
    if (!_canShowAds) {
      onAdDismissed?.call();
      return false;
    }

    if (_interstitialAd == null) {
      onAdDismissed?.call();
      _loadInterstitialAd();
      return false;
    }

    _interstitialAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (InterstitialAd ad) {
        ad.dispose();
        _loadInterstitialAd();
        onAdDismissed?.call();
      },
      onAdFailedToShowFullScreenContent: (InterstitialAd ad, AdError error) {
        ad.dispose();
        _loadInterstitialAd();
        onAdDismissed?.call();
      },
    );

    _interstitialAd!.show();
    _interstitialAd = null;
    return true;
  }

  // ============================================================================
  // REWARDED ADS
  // ============================================================================

  bool get isRewardedAdReady => _rewardedAd != null;
  Completer<bool>? _rewardedAdLoadCompleter;

  Future<bool> loadRewardedAd() async {
    if (isRewardedAdReady) return true;
    if (!_canShowAds) return false;

    if (_rewardedAdLoadCompleter != null &&
        !_rewardedAdLoadCompleter!.isCompleted) {
      return _rewardedAdLoadCompleter!.future;
    }

    _rewardedAdLoadCompleter = Completer<bool>();

    RewardedAd.load(
      adUnitId: _rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (RewardedAd ad) {
          _rewardedAd = ad;
          _numRewardedLoadAttempts = 0;
          _rewardedAdLoadCompleter?.complete(true);
        },
        onAdFailedToLoad: (LoadAdError error) {
          _rewardedAd = null;
          _numRewardedLoadAttempts += 1;
          _rewardedAdLoadCompleter?.complete(false);
        },
      ),
    );

    return _rewardedAdLoadCompleter!.future;
  }

  void _loadRewardedAd() {
    if (!_canShowAds) return;
    RewardedAd.load(
      adUnitId: _rewardedAdUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (RewardedAd ad) {
          _rewardedAd = ad;
          _numRewardedLoadAttempts = 0;
        },
        onAdFailedToLoad: (LoadAdError error) {
          _rewardedAd = null;
          _numRewardedLoadAttempts += 1;
          if (_numRewardedLoadAttempts < _maxAttempts) {
            final delay = _numRewardedLoadAttempts * 2;
            Future.delayed(Duration(seconds: delay), _loadRewardedAd);
          }
        },
      ),
    );
  }

  bool showRewardedAd({
    required void Function(RewardItem) onUserEarnedReward,
    VoidCallback? onAdDismissed,
  }) {
    if (!_canShowAds) {
      onUserEarnedReward(RewardItem(1, 'premium_skip'));
      onAdDismissed?.call();
      return false;
    }

    if (_rewardedAd == null) {
      onAdDismissed?.call();
      _loadRewardedAd();
      return false;
    }

    _rewardedAd!.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (RewardedAd ad) {
        ad.dispose();
        _loadRewardedAd();
        onAdDismissed?.call();
      },
      onAdFailedToShowFullScreenContent: (RewardedAd ad, AdError error) {
        ad.dispose();
        _loadRewardedAd();
        onAdDismissed?.call();
      },
    );

    _rewardedAd!.setImmersiveMode(true);
    _rewardedAd!.show(
      onUserEarnedReward: (AdWithoutView ad, RewardItem reward) {
        onUserEarnedReward(reward);
      },
    );
    _rewardedAd = null;
    return true;
  }

  // ============================================================================
  // NATIVE ADS & BANNER
  // ============================================================================

  NativeAd? createNativeAd({
    required void Function(NativeAd) onAdLoaded,
    required void Function() onAdFailedToLoad,
  }) {
    if (!_canShowAds) return null;
    return NativeAd(
      adUnitId: _nativeAdUnitId,
      factoryId: 'listTile',
      request: const AdRequest(),
      listener: NativeAdListener(
        onAdLoaded: (ad) => onAdLoaded(ad as NativeAd),
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          onAdFailedToLoad();
        },
      ),
    )..load();
  }

  BannerAd? createBannerAd({
    AdSize size = AdSize.banner,
    void Function(Ad)? onAdLoaded,
    void Function(Ad, LoadAdError)? onAdFailedToLoad,
  }) {
    if (!_canShowAds) return null;
    return BannerAd(
      adUnitId: _bannerAdUnitId,
      size: size,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) => onAdLoaded?.call(ad),
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          onAdFailedToLoad?.call(ad, error);
        },
      ),
    )..load();
  }

  void dispose() {
    _interstitialAd?.dispose();
    _rewardedAd?.dispose();
  }
}
