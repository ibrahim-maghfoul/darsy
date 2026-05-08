import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../../data/models/user_model.dart';
import 'api_service.dart';

class AuthResult {
  final UserModel user;
  final String token;

  AuthResult({required this.user, required this.token});
}

class AuthService {
  final ApiService _api;

  AuthService(this._api);

  /// Register with email + password
  Future<AuthResult> register({
    required String email,
    required String password,
    required String displayName,
    required String nickname,
  }) async {
    try {
      final response = await _api.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'displayName': displayName,
          'nickname': nickname,
        },
      );

      final data = response.data;
      final user = UserModel.fromJson(data['user']);
      final token = data['token'] as String;

      await _api.saveToken(token);
      return AuthResult(user: user, token: token);
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Registration failed';
      throw AuthException(message);
    }
  }

  /// Login with email + password
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final data = response.data;
      final user = UserModel.fromJson(data['user']);
      final token = data['token'] as String;

      await _api.saveToken(token);
      return AuthResult(user: user, token: token);
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Login failed';
      throw AuthException(message);
    }
  }

  /// Login with Google (sends idToken to backend)
  Future<AuthResult> loginWithGoogle({required String idToken}) async {
    try {
      final response = await _api.post(
        '/auth/google',
        data: {'idToken': idToken},
      );

      final data = response.data;
      final user = UserModel.fromJson(data['user']);
      final token = data['token'] as String;

      await _api.saveToken(token);
      return AuthResult(user: user, token: token);
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Google login failed';
      throw AuthException(message);
    }
  }

  /// Get current user profile
  Future<UserModel> getProfile() async {
    try {
      final response = await _api.get('/user/profile');
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await _api.clearToken();
        throw AuthException('Session expired. Please login again.');
      }
      throw AuthException('Failed to fetch profile');
    }
  }

  /// Update user profile
  Future<UserModel> updateProfile(Map<String, dynamic> updates) async {
    try {
      final response = await _api.patch('/user/profile', data: updates);
      return UserModel.fromJson(response.data);
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Profile update failed';
      throw AuthException(message);
    }
  }

  /// Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      await _api.post(
        '/user/change-password',
        data: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Password change failed';
      throw AuthException(message);
    }
  }

  /// Upload profile picture
  Future<void> uploadProfilePicture(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'photo': await MultipartFile.fromFile(
          filePath,
          filename: 'profile.jpg',
        ),
      });
      await _api.uploadFile('/user/profile/photo', formData: formData);
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Photo upload failed';
      throw AuthException(message);
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (e) {
      debugPrint('Logout endpoint failed: $e');
    } finally {
      await _api.clearToken();
    }
  }

  /// Delete account
  Future<void> deleteAccount() async {
    try {
      await _api.delete('/user/profile');
      await _api.clearToken();
    } on DioException catch (e) {
      final message = e.response?.data?['error'] ?? 'Account deletion failed';
      throw AuthException(message);
    }
  }
}

class AuthException implements Exception {
  final String message;
  AuthException(this.message);

  @override
  String toString() => message;
}
