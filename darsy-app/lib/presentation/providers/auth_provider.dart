import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/services/api_service.dart';
import '../../core/services/auth_service.dart';
import '../../data/models/user_model.dart';
import 'preferences_provider.dart';

/// Auth state
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;
  final bool needsProfileCompletion;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
    this.needsProfileCompletion = false,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
    bool? needsProfileCompletion,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
      needsProfileCompletion:
          needsProfileCompletion ?? this.needsProfileCompletion,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  late final AuthService _authService;
  late final ApiService _apiService;

  @override
  AuthState build() {
    _authService = ref.watch(authServiceProvider);
    _apiService = ref.watch(apiServiceProvider);

    // Load cached profile immediately
    final prefSvc = ref.read(preferencesProvider);
    final cachedName = prefSvc.getUserName();
    UserModel? cachedUser;
    if (cachedName != null) {
      cachedUser = UserModel(
        id: '',
        email: '',
        displayName: cachedName,
        photoURL: prefSvc.getProfilePicture(),
        nickname: prefSvc.getNickname(),
        city: prefSvc.getCity(),
        age: prefSvc.getAge(),
        gender: prefSvc.getGender(),
        phone: prefSvc.getMobile(),
        level: UserLevel(guidance: prefSvc.getLevelTitle()),
      );
    }

    // Check auth on startup
    Future.microtask(() => _checkAuth());

    return AuthState(user: cachedUser, isLoading: cachedUser == null);
  }

  /// Check if user has an existing session
  Future<void> _checkAuth() async {
    try {
      await _apiService.loadToken();
      if (!_apiService.hasToken) {
        state = const AuthState(isLoading: false);
        return;
      }

      final user = await _authService.getProfile();
      _syncProfileToPrefs(user);
      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
    } catch (e) {
      debugPrint('Auth check failed: $e');
      // If we have a cached user, keep them but mark as not authenticated (or authenticated but offline)
      if (state.user != null) {
        state = state.copyWith(isLoading: false, isAuthenticated: true);
      } else {
        state = const AuthState(isLoading: false);
      }
    }
  }

  /// Public method to force re-checking auth state
  Future<void> checkAuth() async {
    await _checkAuth();
  }

  /// Login with email + password
  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authService.login(email: email, password: password);
      _syncProfileToPrefs(result.user);
      final needsCompletion =
          result.user.age == null || result.user.city == null;
      state = AuthState(
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        needsProfileCompletion: needsCompletion,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Login failed');
    }
  }

  /// Register with email + password
  Future<void> register({
    required String email,
    required String password,
    required String displayName,
    required String nickname,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authService.register(
        email: email,
        password: password,
        displayName: displayName,
        nickname: nickname,
      );
      _syncProfileToPrefs(result.user);
      state = AuthState(
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        needsProfileCompletion: true,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Registration failed');
    }
  }

  /// Login with Google
  Future<void> loginWithGoogle({required String idToken}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final result = await _authService.loginWithGoogle(idToken: idToken);
      _syncProfileToPrefs(result.user);
      final needsCompletion =
          result.user.age == null || result.user.city == null;

      state = AuthState(
        user: result.user,
        isAuthenticated: true,
        isLoading: false,
        needsProfileCompletion: needsCompletion,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Google login failed');
    }
  }

  /// Update the user profile
  Future<void> updateProfile(Map<String, dynamic> updates) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final updatedUser = await _authService.updateProfile(updates);
      _syncProfileToPrefs(updatedUser);
      state = AuthState(
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      );
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    }
  }

  /// Refresh user data from server
  Future<void> refreshUser() async {
    try {
      final user = await _authService.getProfile();
      _syncProfileToPrefs(user);
      state = state.copyWith(user: user);
    } catch (e) {
      debugPrint('Refresh user failed: $e');
    }
  }

  void _syncProfileToPrefs(UserModel user) {
    final prefSvc = ref.read(preferencesProvider);
    prefSvc.saveUserName(user.displayName);
    if (user.nickname != null) prefSvc.saveNickname(user.nickname!);
    if (user.city != null) prefSvc.saveCity(user.city!);
    if (user.age != null) prefSvc.saveAge(user.age!);
    if (user.gender != null) prefSvc.saveGender(user.gender!);
    if (user.phone != null) prefSvc.saveMobile(user.phone!);
    if (user.photoURL != null) prefSvc.saveProfilePicture(user.photoURL!);
    if (user.level?.guidance != null) {
      prefSvc.saveLevelTitle(user.level!.guidance!);
    }
  }

  /// Logout
  Future<void> logout() async {
    await _authService.logout();
    final prefSvc = ref.read(preferencesProvider);
    await prefSvc
        .clearAll(); // Better to clear all on logout to avoid mixing user data
    state = const AuthState(isLoading: false);
  }

  /// Delete account
  Future<void> deleteAccount() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _authService.deleteAccount();
      state = const AuthState(isLoading: false);
    } on AuthException catch (e) {
      state = state.copyWith(isLoading: false, error: e.message);
    }
  }

  /// Clear any error
  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ─── Providers ───────────────────────────────

final authServiceProvider = Provider<AuthService>((ref) {
  final api = ref.watch(apiServiceProvider);
  return AuthService(api);
});

final authProvider = NotifierProvider<AuthNotifier, AuthState>(
  AuthNotifier.new,
);

/// Convenience provider to get current user
final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authProvider).user;
});

/// Convenience provider to check if user is authenticated
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});
