import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:in_app_review/in_app_review.dart';

import 'core/app_theme.dart';
import 'core/services/api_service.dart';
import 'core/services/hive_service.dart';
import 'core/services/first_launch_service.dart';
import 'core/services/preferences_service.dart';
import 'core/services/news_service.dart';
import 'l10n/app_localizations.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/language_provider.dart';
import 'presentation/providers/theme_provider.dart';
import 'presentation/providers/preferences_provider.dart';
import 'presentation/screens/login_screen.dart';
import 'presentation/screens/main_screen.dart';
import 'presentation/screens/onboarding_screen.dart';
import 'presentation/screens/profile_setup_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Robust initialization with error handling
  try {
    debugPrint('🚀 Starting App Initialization...');

    // 1. Initialize Firebase (Critical)
    try {
      await Firebase.initializeApp();
      debugPrint('✅ Firebase initialized');
    } catch (e) {
      debugPrint('❌ Firebase initialization failed: $e');
      // Firebase failure is semi-critical depending on usage
    }

    // 2. Initialize Hive (Critical for local storage)
    try {
      await Hive.initFlutter();
      final hiveService = HiveService();
      await hiveService.init();
      debugPrint('✅ Hive initialized');
    } catch (e) {
      debugPrint('❌ Hive initialization failed: $e');
    }

    // 3. Initialize Preferences (Critical for app state)
    late PreferencesService preferencesService;
    try {
      preferencesService = await PreferencesService.init();
      debugPrint('✅ Shared Preferences initialized');
    } catch (e) {
      debugPrint('❌ Shared Preferences initialization failed: $e');
      // Fallback or rethrow if truly critical
    }

    // 4. Initialize API Service
    final apiService = ApiService();
    try {
      await apiService.loadToken();
      debugPrint('✅ API Service token loaded');
    } catch (e) {
      debugPrint('⚠️ Token loading failed (expected for new users): $e');
    }

    // 6. Check First Launch
    final firstLaunchService = FirstLaunchService();
    final isFirstLaunch = await firstLaunchService.isFirstLaunch();
    final isOnboardingCompleted = preferencesService.isOnboardingCompleted();

    debugPrint('✨ Initialization Complete. Running App...');

    runApp(
      ProviderScope(
        overrides: [
          preferencesProvider.overrideWithValue(preferencesService),
          hiveServiceProvider.overrideWithValue(
            HiveService(),
          ), // Note: Using singleton instance might be better but keeping consistency
          apiServiceProvider.overrideWithValue(apiService),
        ],
        child: MyApp(
          isFirstLaunch: isFirstLaunch,
          isOnboardingCompleted: isOnboardingCompleted,
        ),
      ),
    );
  } catch (e, stackTrace) {
    debugPrint('🚨 CRITICAL INITIALIZATION FAILURE: $e');
    debugPrint(stackTrace.toString());

    // Show a minimal error app if initialization fails completely
    runApp(
      MaterialApp(
        home: Scaffold(
          body: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.red, size: 64),
                  const SizedBox(height: 16),
                  const Text(
                    'Darsy failed to start',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Error: $e',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Simple way to restart the app or exit
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class MyApp extends ConsumerStatefulWidget {
  final bool isFirstLaunch;
  final bool isOnboardingCompleted;

  const MyApp({
    super.key,
    required this.isFirstLaunch,
    required this.isOnboardingCompleted,
  });

  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  @override
  void initState() {
    super.initState();
    _startRatingTimer();
  }

  void _startRatingTimer() {
    // Show rating prompt after 5 minutes of app usage
    Future.delayed(const Duration(minutes: 5), () async {
      final r = InAppReview.instance;
      if (await r.isAvailable()) {
        r.requestReview();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    final locale = ref.watch(languageProvider);
    final authState = ref.watch(authProvider);

    // Determine initial screen based on auth state
    Widget initialScreen;
    if (authState.isLoading) {
      initialScreen = const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    } else if (widget.isFirstLaunch || !widget.isOnboardingCompleted) {
      initialScreen = const OnboardingScreen();
    } else if (!authState.isAuthenticated) {
      initialScreen = const LoginScreen();
    } else if (authState.needsProfileCompletion) {
      initialScreen = const ProfileSetupScreen();
    } else {
      initialScreen = const MainScreen();
    }

    return MaterialApp(
      navigatorKey: MyApp.navigatorKey,
      title: 'Darsy',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(locale.languageCode, isDark: false),
      darkTheme: AppTheme.getTheme(locale.languageCode, isDark: true),
      themeMode: themeMode,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      builder: (context, child) {
        final isArabic = locale.languageCode == 'ar';
        return Directionality(
          textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
          child: child!,
        );
      },
      home: initialScreen,
    );
  }
}
