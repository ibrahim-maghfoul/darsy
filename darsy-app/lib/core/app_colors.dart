import 'package:flutter/material.dart';

class AppColors {
  // Main Palette
  static const Color primary = Color(0xFF22C55E); // Green (Website style)
  static const Color secondary = Color(0xFF10B981); // Complementary Green
  static const Color accent = Color(0xFFF59E0B); // Amber/Orange

  // Backgrounds
  static const Color backgroundLight = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(
    0xFF0B1220,
  ); // Keep existing dark mode base
  static const Color surfaceLight = Color(
    0xFFF3F4F6,
  ); // Light grey for inputs/cards

  // Text
  static const Color textDark = Color(0xFF111827);
  static const Color textLight = Color(0xFFFFFFFF);
  static const Color textGrey = Color(0xFF6B7280);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF4ADE80), Color(0xFF22C55E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient orangeGradient = LinearGradient(
    colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient blueGradient = LinearGradient(
    colors: [Color(0xFF60A5FA), Color(0xFF3B82F6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient greenGradient = LinearGradient(
    colors: [Color(0xFF4ADE80), Color(0xFF22C55E)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Semantic
  static const Color error = Color(0xFFEF4444);
  static const Color success = Color(0xFF10B981);

  // Legacy/Helpers
  static const Color grey = Color(0xFF64748B);
}
