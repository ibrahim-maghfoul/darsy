import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/app_colors.dart';
import '../providers/auth_provider.dart';
import 'profile_setup_screen.dart';
import 'main_screen.dart';
import '../widgets/styled_snackbar.dart';
import '../../l10n/app_localizations.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _nicknameController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLogin = true;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _nicknameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final notifier = ref.read(authProvider.notifier);

    try {
      if (_isLogin) {
        await notifier.login(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );
      } else {
        await notifier.register(
          email: _emailController.text.trim(),
          password: _passwordController.text,
          displayName: _nameController.text.trim(),
          nickname: _nicknameController.text.trim().isNotEmpty
              ? _nicknameController.text.trim()
              : _nameController.text.trim(),
        );
      }

      if (mounted && ref.read(authProvider).isAuthenticated) {
        _handleRedirection();
      }
    } catch (e) {
      // Error handled by ref.listen
    }
  }

  Future<void> _handleGoogleSignIn() async {
    try {
      final GoogleSignIn googleSignIn = GoogleSignIn();
      final GoogleSignInAccount? account = await googleSignIn.signIn();

      if (account != null) {
        final GoogleSignInAuthentication auth = await account.authentication;

        if (auth.idToken != null) {
          await ref
              .read(authProvider.notifier)
              .loginWithGoogle(idToken: auth.idToken!);

          if (mounted && ref.read(authProvider).isAuthenticated) {
            _handleRedirection();
          }
        }
      }
    } catch (error) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Google Sign-In failed: $error');
      }
    }
  }

  void _handleRedirection() {
    final authState = ref.read(authProvider);
    if (authState.needsProfileCompletion) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const ProfileSetupScreen()),
      );
    } else {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const MainScreen()));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);
    // ignore: unused_local_variable
    final isArabic = Localizations.localeOf(context).languageCode == 'ar';

    // Listen for errors
    ref.listen<AuthState>(authProvider, (prev, next) {
      if (next.error != null) {
        StyledSnackBar.showError(context, next.error!);
        ref.read(authProvider.notifier).clearError();
      }
    });

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo / App Name
                  Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: Icon(
                          Icons.school_rounded,
                          size: 40,
                          color: AppColors.primary,
                        ),
                      )
                      .animate()
                      .fadeIn(duration: 400.ms)
                      .scale(begin: const Offset(0.8, 0.8)),

                  const SizedBox(height: 16),

                  Text(
                    '9eray',
                    style: theme.textTheme.headlineLarge?.copyWith(
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ).animate().fadeIn(delay: 100.ms),

                  const SizedBox(height: 8),

                  Text(
                    _isLogin
                        ? context.translate('welcome_back')
                        : context.translate('create_account'),
                    style: theme.textTheme.bodyLarge?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ).animate().fadeIn(delay: 200.ms),

                  const SizedBox(height: 40),

                  // Name field (registration only)
                  if (!_isLogin) ...[
                    _buildTextField(
                      controller: _nameController,
                      label: context.translate('full_name'),
                      icon: Icons.person_outline,
                      validator: (v) => v == null || v.trim().isEmpty
                          ? context.translate('enter_name')
                          : null,
                    ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.1),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _nicknameController,
                      label:
                          '${context.translate('nickname')} (${context.translate('optional')})',
                      icon: Icons.badge_outlined,
                      validator: null,
                    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),
                    const SizedBox(height: 16),
                  ],

                  // Email
                  _buildTextField(
                    controller: _emailController,
                    label: context.translate('email'),
                    icon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    validator: (v) {
                      if (v == null || v.trim().isEmpty)
                        return context.translate('enter_email');
                      if (!v.contains('@'))
                        return context.translate('invalid_email');
                      return null;
                    },
                  ).animate().fadeIn(delay: 350.ms).slideY(begin: 0.1),

                  const SizedBox(height: 16),

                  // Password
                  _buildTextField(
                    controller: _passwordController,
                    label: context.translate('password'),
                    icon: Icons.lock_outline,
                    obscureText: _obscurePassword,
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: theme.colorScheme.onSurface.withOpacity(0.4),
                      ),
                      onPressed: () =>
                          setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty)
                        return context.translate('enter_password');
                      if (v.length < 6)
                        return context.translate('password_too_short');
                      return null;
                    },
                  ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),

                  const SizedBox(height: 28),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: authState.isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                      child: authState.isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                strokeWidth: 2.5,
                                valueColor: AlwaysStoppedAnimation(
                                  Colors.white,
                                ),
                              ),
                            )
                          : Text(
                              _isLogin
                                  ? context.translate('login')
                                  : context.translate('register'),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                    ),
                  ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.1),

                  const SizedBox(height: 20),

                  // Divider
                  Row(
                    children: [
                      Expanded(
                        child: Divider(
                          color: theme.colorScheme.onSurface.withOpacity(0.1),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          context.translate('or'),
                          style: TextStyle(
                            color: theme.colorScheme.onSurface.withOpacity(0.4),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Divider(
                          color: theme.colorScheme.onSurface.withOpacity(0.1),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 550.ms),

                  const SizedBox(height: 20),

                  // Google Sign-In
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: OutlinedButton.icon(
                      onPressed: authState.isLoading
                          ? null
                          : _handleGoogleSignIn,
                      icon: Image.asset(
                        'assets/images/google_logo.png',
                        width: 20,
                        height: 20,
                        errorBuilder: (_, __, ___) =>
                            const Icon(Icons.g_mobiledata, size: 24),
                      ),
                      label: Text(
                        context.translate('continue_with_google'),
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      style: OutlinedButton.styleFrom(
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        side: BorderSide(
                          color: theme.colorScheme.onSurface.withOpacity(0.12),
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.1),

                  const SizedBox(height: 28),

                  // Toggle login/register
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _isLogin
                            ? context.translate('no_account')
                            : context.translate('have_account'),
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withOpacity(0.5),
                        ),
                      ),
                      TextButton(
                        onPressed: () => setState(() => _isLogin = !_isLogin),
                        child: Text(
                          _isLogin
                              ? context.translate('register_here')
                              : context.translate('login_here'),
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 700.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    final theme = Theme.of(context);
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(
          icon,
          color: theme.colorScheme.onSurface.withOpacity(0.4),
        ),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: theme.colorScheme.onSurface.withOpacity(0.04),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
      ),
    );
  }
}
