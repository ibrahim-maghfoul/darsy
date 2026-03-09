import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:darsy/presentation/providers/preferences_provider.dart';
import 'package:darsy/presentation/widgets/eye_care_dialog.dart';

final eyeCareServiceProvider = Provider<EyeCareService>((ref) {
  return EyeCareService(ref);
});

class EyeCareService {
  final Ref _ref;
  Timer? _timer;
  static const Duration _interval = Duration(minutes: 15);
  bool _isDialogShowing = false;

  EyeCareService(this._ref);

  void startTimer(BuildContext context) {
    _timer?.cancel();
    _timer = Timer.periodic(_interval, (timer) {
      _showReminder(context);
    });
  }

  void stopTimer() {
    _timer?.cancel();
    _timer = null;
  }

  void _showReminder(BuildContext context) {
    final prefs = _ref.read(preferencesProvider);
    if (!prefs.isEyeCareEnabled()) return;
    if (_isDialogShowing) return;

    _isDialogShowing = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const EyeCareDialog(),
    ).then((_) {
      _isDialogShowing = false;
    });
  }
}
