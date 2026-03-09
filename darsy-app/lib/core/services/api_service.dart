import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Central API configuration
class ApiConfig {
  // Update this to your machine's LAN IP for physical devices:
  static const String _lanIp = '10.37.107.9';

  // Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator, or LAN IP for physical devices.
  static const String baseUrl = 'http://$_lanIp:5000/api';

  // Alternative options (uncomment to use):
  // static const String baseUrl = 'http://10.0.2.2:5000/api'; // Android Emulator
  // static const String baseUrl = 'http://localhost:5000/api'; // iOS Simulator
  static const Duration connectTimeout = Duration(seconds: 60);
  static const Duration receiveTimeout = Duration(seconds: 60);

  /// Shared secret — must match APP_API_KEY in backend .env
  static const String appApiKey = 'darsy-secret-2026-x9k2p';
}

class ApiService {
  late final Dio _dio;
  String? _token;

  ApiService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'X-App-Key': ApiConfig.appApiKey,
        },
      ),
    );

    // Request interceptor — attach auth token
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          debugPrint('🌐 ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          debugPrint(
            '✅ ${response.statusCode} ${response.requestOptions.path}',
          );
          return handler.next(response);
        },
        onError: (error, handler) {
          debugPrint(
            '❌ ${error.response?.statusCode} ${error.requestOptions.path}: ${error.message}',
          );
          return handler.next(error);
        },
      ),
    );
  }

  /// Set the auth token (called after login)
  void setToken(String? token) {
    _token = token;
  }

  /// Load token from SharedPreferences
  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
  }

  /// Save token to SharedPreferences
  Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  /// Clear token (logout)
  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  bool get hasToken => _token != null && _token!.isNotEmpty;
  String? get token => _token;

  // ─── HTTP Methods ────────────────────────────

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data, Options? options}) {
    return _dio.post(path, data: data, options: options);
  }

  Future<Response> patch(String path, {dynamic data}) {
    return _dio.patch(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path, {dynamic data}) {
    return _dio.delete(path, data: data);
  }

  /// Upload file with progress
  Future<Response> uploadFile(
    String path, {
    required FormData formData,
    void Function(int, int)? onSendProgress,
  }) {
    return _dio.post(
      path,
      data: formData,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      onSendProgress: onSendProgress,
    );
  }

  /// Get the base URL (useful for constructing image/resource URLs)
  String get baseUrl => ApiConfig.baseUrl.replaceAll('/api', '');
}

// Global provider
final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});
