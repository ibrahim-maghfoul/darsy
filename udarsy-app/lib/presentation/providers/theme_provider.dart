import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/preferences_service.dart';
import 'preferences_provider.dart';

class ThemeNotifier extends Notifier<ThemeMode> {
  static ThemeMode _initTheme(PreferencesService prefs) {
    final isDark = prefs.isDarkMode();
    return isDark ? ThemeMode.dark : ThemeMode.light;
  }

  @override
  ThemeMode build() {
    final prefs = ref.watch(preferencesProvider);
    return _initTheme(prefs);
  }

  void toggleTheme() {
    final isDark = state == ThemeMode.dark;
    state = isDark ? ThemeMode.light : ThemeMode.dark;
    final prefs = ref.read(preferencesProvider);
    prefs.saveIsDarkMode(!isDark);
  }
}

final themeProvider = NotifierProvider<ThemeNotifier, ThemeMode>(
  ThemeNotifier.new,
);
