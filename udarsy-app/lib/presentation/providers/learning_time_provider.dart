import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'user_progress_provider.dart';

/**
 * LearningTimeProvider tracks the duration the user spends actively 
 * studying in the app. It updates the UserProgressNotifier every minute.
 */
final learningTimeProvider = Provider((ref) {
  Timer? timer;
  int seconds = 0;

  void startTracking() {
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (t) {
      seconds++;
      // Every 60 seconds, update the progress notifier
      if (seconds >= 60) {
        ref.read(userProgressProvider.notifier).addLearningTime(1);
        seconds = 0;
      }
    });
  }

  void stopTracking() {
    timer?.cancel();
    timer = null;
  }

  // Handle app lifecycle if needed, but for simplicity we rely on
  // the provider's existence in the MainScreen or Home.

  startTracking();

  ref.onDispose(() {
    stopTracking();
  });

  return null;
});
