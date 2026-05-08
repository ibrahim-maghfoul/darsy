import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

enum ConnectivityStatus { online, offline, checking }

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();

  /// Check if device has internet connectivity
  Future<bool> hasInternetConnection() async {
    try {
      final result = await InternetAddress.lookup('google.com');
      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
        return true;
      }
    } on SocketException catch (_) {
      return false;
    }
    return false;
  }

  /// Stream of connectivity changes
  Stream<ConnectivityStatus> get statusStream {
    return _connectivity.onConnectivityChanged.asyncMap((results) async {
      // connectivity_plus returns a list of results
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (!hasConnection) return ConnectivityStatus.offline;

      // Double-check with actual DNS lookup
      final hasInternet = await hasInternetConnection();
      return hasInternet
          ? ConnectivityStatus.online
          : ConnectivityStatus.offline;
    });
  }

  /// Get current status
  Future<ConnectivityStatus> getCurrentStatus() async {
    final hasInternet = await hasInternetConnection();
    return hasInternet ? ConnectivityStatus.online : ConnectivityStatus.offline;
  }
}

// Providers
final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  return ConnectivityService();
});

final connectivityStatusProvider = StreamProvider<ConnectivityStatus>((ref) {
  final service = ref.watch(connectivityServiceProvider);

  // Emit initial status then stream changes
  return Stream<ConnectivityStatus>.multi((controller) async {
    final initial = await service.getCurrentStatus();
    controller.add(initial);

    await for (final status in service.statusStream) {
      controller.add(status);
    }
  });
});

/// Simple boolean provider for checking if online
final isOnlineProvider = Provider<bool>((ref) {
  final status = ref.watch(connectivityStatusProvider);
  return status.when(
    data: (s) => s == ConnectivityStatus.online,
    loading: () => true, // Assume online while checking
    error: (_, __) => false,
  );
});
