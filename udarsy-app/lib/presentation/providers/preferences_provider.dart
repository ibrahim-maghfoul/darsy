import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/preferences_service.dart';

// This provider must be overridden in main.dart
final preferencesProvider = Provider<PreferencesService>((ref) {
  throw UnimplementedError('PreferencesService not initialized');
});
