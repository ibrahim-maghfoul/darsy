import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lottie/lottie.dart';
import '../../core/app_colors.dart';

class EyeCareDialog extends StatelessWidget {
  const EyeCareDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(32),
          border: Border.all(
            color: AppColors.primary.withOpacity(0.2),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Animation
            SizedBox(
              height: 180,
              child: Lottie.asset(
                'assets/lottie/eye_care.json',
                errorBuilder: (context, error, stackTrace) {
                  return const Icon(
                    Icons.visibility_rounded,
                    size: 80,
                    color: AppColors.primary,
                  );
                },
              ),
            ).animate().scale(
              delay: 200.ms,
              duration: 400.ms,
              curve: Curves.easeOutBack,
            ),

            const SizedBox(height: 24),

            const Text(
              'Eye Care Break',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 12),

            const Text(
              'You have been using the app for 15 minutes. Please close your eyes or look at a distant object for 20 seconds to rest your eyes.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, color: Colors.grey, height: 1.5),
            ),

            const SizedBox(height: 32),

            // Action button
            SInverseButton(
              onPressed: () => Navigator.pop(context),
              text: 'Thanks, I will rest',
            ),
          ],
        ),
      ),
    );
  }
}

class SInverseButton extends StatelessWidget {
  final VoidCallback onPressed;
  final String text;

  const SInverseButton({
    super.key,
    required this.onPressed,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
        ),
        child: Text(
          text,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
