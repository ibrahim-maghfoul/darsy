import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppTheme {
  static ThemeData getTheme(String currentLanguage, {bool isDark = false}) {
    final baseFont = GoogleFonts.cairo();
    final textThemeBase = GoogleFonts.cairoTextTheme();

    final colors = isDark ? _darkColorScheme : _lightColorScheme;
    final scaffoldBg = isDark
        ? AppColors.backgroundDark
        : AppColors.backgroundLight;
    final bodyColor = isDark ? AppColors.textLight : AppColors.textDark;

    return ThemeData(
      useMaterial3: true,
      fontFamily: baseFont.fontFamily,
      colorScheme: colors,
      textTheme: textThemeBase.apply(
        bodyColor: bodyColor,
        displayColor: bodyColor,
        fontFamily: baseFont.fontFamily,
      ),
      scaffoldBackgroundColor: scaffoldBg,
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: isDark ? AppColors.secondary : AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(30),
          ),
          textStyle: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            fontFamily: baseFont.fontFamily,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark ? const Color(0xFF1F2937) : AppColors.surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(
            color: isDark ? AppColors.secondary : AppColors.primary,
            width: 1.5,
          ),
        ),
        contentPadding: const EdgeInsets.all(16),
        hintStyle: const TextStyle(color: AppColors.textGrey),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: bodyColor,
          fontSize: 20,
          fontWeight: FontWeight.bold,
          fontFamily: baseFont.fontFamily,
        ),
        iconTheme: IconThemeData(color: bodyColor),
      ),
      cardTheme: CardThemeData(
        color: isDark ? const Color(0xFF1F2937) : Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  static final ColorScheme _lightColorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.secondary,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    tertiary: AppColors.accent,
    surface: AppColors.backgroundLight,
  );

  static final ColorScheme _darkColorScheme = ColorScheme.fromSeed(
    seedColor: AppColors.secondary,
    primary: AppColors.primary,
    secondary: AppColors.secondary,
    tertiary: AppColors.accent,
    brightness: Brightness.dark,
    surface: AppColors.backgroundDark,
  );
}
