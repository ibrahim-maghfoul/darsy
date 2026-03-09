import 'package:flutter/material.dart';
import '../../core/app_colors.dart';

/// Custom styled snackbar helper
class StyledSnackBar {
  /// Show a success snackbar with website-like theme
  static void showSuccess(BuildContext context, String message) {
    _show(context, message, AppColors.primary, Icons.check_circle_rounded);
  }

  /// Show an error snackbar
  static void showError(BuildContext context, String message) {
    _show(context, message, AppColors.error, Icons.error_rounded);
  }

  /// Show a warning snackbar
  static void showWarning(BuildContext context, String message) {
    _show(context, message, Colors.orange.shade700, Icons.warning_rounded);
  }

  /// Show an info snackbar
  static void showInfo(BuildContext context, String message) {
    _show(context, message, AppColors.secondary, Icons.info_rounded);
  }

  /// Show a beautiful gradient yellow snackbar for successful ratings
  static void showRatingSuccess(BuildContext context, String message) {
    _show(
      context,
      message,
      Colors.amber,
      Icons.star_rounded,
      gradient: const LinearGradient(
        colors: [Color(0xFFFFB300), Color(0xFFFF8F00)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    );
  }

  /// Show a pink snackbar for favorites
  static void showFavoriteSuccess(BuildContext context, String message) {
    _show(
      context,
      message,
      Colors.pinkAccent,
      Icons.favorite_rounded,
      gradient: const LinearGradient(
        colors: [Color(0xFFFF4081), Color(0xFFE91E63)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
    );
  }

  static void _show(
    BuildContext context,
    String message,
    Color accentColor,
    IconData icon, {
    Gradient? gradient,
  }) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        padding: EdgeInsets.zero,
        duration: const Duration(seconds: 3),
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: gradient == null ? const Color(0xFF1F2937) : null,
            gradient: gradient,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: gradient != null
                  ? Colors.white.withOpacity(0.3)
                  : accentColor.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Row(
            children: [
              Icon(icon, color: Colors.white, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
