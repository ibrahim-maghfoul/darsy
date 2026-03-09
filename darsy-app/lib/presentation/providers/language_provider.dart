import 'dart:ui';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/preferences_service.dart';
import 'preferences_provider.dart';

class LanguageNotifier extends Notifier<Locale> {
  static Locale _initLocale(PreferencesService prefs) {
    final code = prefs.getLanguage();
    if (code != null) {
      return Locale(code);
    }
    return const Locale('fr'); // Default to French
  }

  @override
  Locale build() {
    final prefs = ref.watch(preferencesProvider);
    return _initLocale(prefs);
  }

  void setLanguage(Locale locale) {
    state = locale;
    final prefs = ref.read(preferencesProvider);
    prefs.saveLanguage(locale.languageCode);
  }

  void toggleLanguage() {
    if (state.languageCode == 'ar') {
      setLanguage(const Locale('fr'));
    } else if (state.languageCode == 'fr') {
      setLanguage(const Locale('en'));
    } else {
      setLanguage(const Locale('ar'));
    }
  }
}

final languageProvider = NotifierProvider<LanguageNotifier, Locale>(
  LanguageNotifier.new,
);
