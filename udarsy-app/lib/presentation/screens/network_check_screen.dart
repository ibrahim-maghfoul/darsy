import 'dart:io';
import 'package:flutter/material.dart';
import '../../core/app_colors.dart';

class NetworkCheckScreen extends StatefulWidget {
  final VoidCallback onConnected;

  const NetworkCheckScreen({super.key, required this.onConnected});

  @override
  State<NetworkCheckScreen> createState() => _NetworkCheckScreenState();
}

class _NetworkCheckScreenState extends State<NetworkCheckScreen> {
  bool _isChecking = false;

  Future<void> _checkConnection() async {
    setState(() => _isChecking = true);

    // Artificial delay for better UX
    await Future.delayed(const Duration(milliseconds: 800));

    bool hasInternet = false;
    try {
      // Try multiple DNS lookups for better reliability
      final results = await Future.wait([
        InternetAddress.lookup('google.com'),
        InternetAddress.lookup('cloudflare.com'),
      ]).timeout(const Duration(seconds: 5));

      hasInternet = results.any(
        (result) => result.isNotEmpty && result[0].rawAddress.isNotEmpty,
      );
    } catch (e) {
      // If all lookups fail, assume no internet
      hasInternet = false;
    }

    if (!mounted) return;

    if (hasInternet) {
      widget.onConnected();
    } else {
      setState(() => _isChecking = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'No internet connection found. Please check your connection and try again.',
          ),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.wifi_off_rounded,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Internet Required',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'To set up the app for the first time, we need to download essential data. Please connect to the internet to proceed.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textGrey,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 48),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isChecking ? null : _checkConnection,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: _isChecking
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Retry Connection',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
