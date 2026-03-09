import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:app_settings/app_settings.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/app_colors.dart';
import '../../core/constants.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/language_provider.dart';
import '../providers/preferences_provider.dart';
import 'profile_setup_screen.dart';

import '../widgets/styled_snackbar.dart';
import '../../l10n/app_localizations.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  final int initialTab;
  const SettingsScreen({super.key, this.initialTab = 0});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  late int _selectedTab;

  // Profile form controllers
  late TextEditingController _nameCtrl;
  late TextEditingController _nicknameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _ageCtrl;
  late TextEditingController _schoolNameCtrl;
  String? _selectedCity;
  String? _selectedGender;
  bool _isSavingProfile = false;

  // Password form controllers
  late TextEditingController _currentPasswordCtrl;
  late TextEditingController _newPasswordCtrl;
  bool _isChangingPassword = false;

  // Billing
  bool _isYearly = false;
  bool _isSubscribing = false;

  final _moroccanCities = [
    'Casablanca',
    'Rabat',
    'Marrakech',
    'Fes',
    'Tangier',
    'Agadir',
    'Meknes',
    'Oujda',
    'Kenitra',
    'Tetouan',
    'Safi',
    'Mohammedia',
    'Khouribga',
    'Beni Mellal',
    'El Jadida',
    'Taza',
    'Nador',
    'Settat',
    'Larache',
    'Ksar El Kebir',
    'Khemisset',
    'Guelmim',
    'Berrechid',
    'Oued Zem',
    'Fquih Ben Salah',
    'Taourirt',
    'Berkane',
    'Sidi Slimane',
    'Sidi Qacem',
    'Khenifra',
    'Taroudant',
    'Essaouira',
    'Tiznit',
    'Ouarzazate',
    'Errachidia',
    'Tan-Tan',
    'Dakhla',
    'Laayoune',
  ];

  @override
  void initState() {
    super.initState();
    _selectedTab = widget.initialTab;
    final authState = ref.read(authProvider);
    final user = authState.user;
    _nameCtrl = TextEditingController(text: user?.displayName ?? '');
    _nicknameCtrl = TextEditingController(text: user?.nickname ?? '');
    _phoneCtrl = TextEditingController(text: user?.phone ?? '');
    _ageCtrl = TextEditingController(text: user?.age ?? '');
    _schoolNameCtrl = TextEditingController(text: user?.schoolName ?? '');
    _selectedCity = user?.city;
    _selectedGender = user?.gender;
    _currentPasswordCtrl = TextEditingController();
    _newPasswordCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _nicknameCtrl.dispose();
    _phoneCtrl.dispose();
    _ageCtrl.dispose();
    _schoolNameCtrl.dispose();
    _currentPasswordCtrl.dispose();
    _newPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    setState(() => _isSavingProfile = true);
    try {
      await ref.read(authProvider.notifier).updateProfile({
        'displayName': _nameCtrl.text.trim(),
        'nickname': _nicknameCtrl.text.trim(),
        'phone': _phoneCtrl.text.trim(),
        'age': int.tryParse(_ageCtrl.text.trim()) ?? 0,
        'schoolName': _schoolNameCtrl.text.trim(),
        'city': _selectedCity ?? '',
        'gender': _selectedGender ?? '',
      });
      if (mounted) {
        StyledSnackBar.showSuccess(context, 'Profile saved successfully!');
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Failed to save profile: $e');
      }
    } finally {
      if (mounted) setState(() => _isSavingProfile = false);
    }
  }

  Future<void> _changePassword() async {
    if (_currentPasswordCtrl.text.isEmpty || _newPasswordCtrl.text.isEmpty) {
      StyledSnackBar.showInfo(context, 'Please fill in both password fields');
      return;
    }
    setState(() => _isChangingPassword = true);
    try {
      await ref.read(authProvider.notifier).updateProfile({
        'currentPassword': _currentPasswordCtrl.text,
        'newPassword': _newPasswordCtrl.text,
      });
      _currentPasswordCtrl.clear();
      _newPasswordCtrl.clear();
      if (mounted) {
        StyledSnackBar.showSuccess(context, 'Password changed successfully!');
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Failed to change password: $e');
      }
    } finally {
      if (mounted) setState(() => _isChangingPassword = false);
    }
  }

  Future<void> _subscribe(String plan) async {
    setState(() => _isSubscribing = true);
    try {
      await ref.read(authProvider.notifier).updateProfile({
        'subscription': {
          'plan': plan,
          'billingCycle': _isYearly ? 'yearly' : 'monthly',
        },
      });
      if (mounted) {
        StyledSnackBar.showSuccess(
          context,
          'Successfully subscribed to $plan plan!',
        );
      }
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(context, 'Failed to subscribe: $e');
      }
    } finally {
      if (mounted) setState(() => _isSubscribing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeProvider);
    final currentLocale = ref.watch(languageProvider);
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final currentPlan = user?.subscription?.plan ?? 'free';

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          AppStrings.settings,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          // Tab bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                _buildTab(
                  0,
                  Icons.person_outline_rounded,
                  context.translate('profile_tab'),
                ),
                const SizedBox(width: 8),
                _buildTab(
                  1,
                  Icons.lock_outline_rounded,
                  context.translate('security_tab'),
                ),
                const SizedBox(width: 8),
                _buildTab(
                  2,
                  Icons.credit_card_rounded,
                  context.translate('billing_tab'),
                ),
              ],
            ),
          ),

          Expanded(
            child: IndexedStack(
              index: _selectedTab,
              children: [
                _buildProfileTab(themeMode, currentLocale),
                _buildSecurityTab(),
                _buildBillingTab(currentPlan),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(int index, IconData icon, String label) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primary
                : AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 18,
                color: isSelected ? Colors.white : AppColors.primary,
              ),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isSelected ? Colors.white : AppColors.primary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileTab(ThemeMode themeMode, Locale currentLocale) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Personal info section
        _sectionCard(
          title: context.translate('personal_info'),
          children: [
            _fieldRow(
              icon: Icons.email_outlined,
              label: context.translate('email'),
              child: TextField(
                controller: TextEditingController(
                  text: ref.read(authProvider).user?.email ?? '',
                ),
                readOnly: true,
                decoration: _inputDecoration(context.translate('email')),
                style: const TextStyle(color: AppColors.textGrey),
              ),
            ),
            _fieldRow(
              icon: Icons.person_outline_rounded,
              label: context.translate('full_name'),
              child: TextField(
                controller: _nameCtrl,
                decoration: _inputDecoration(context.translate('full_name')),
              ),
            ),
            _fieldRow(
              icon: Icons.alternate_email_rounded,
              label: context.translate('nickname'),
              child: TextField(
                controller: _nicknameCtrl,
                decoration: _inputDecoration(context.translate('nickname')),
              ),
            ),
            _fieldRow(
              icon: Icons.phone_outlined,
              label: context.translate('phone'),
              child: TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: _inputDecoration('+212600000000'),
              ),
            ),
            _fieldRow(
              icon: Icons.cake_outlined,
              label: context.translate('age'),
              child: TextField(
                controller: _ageCtrl,
                keyboardType: TextInputType.number,
                decoration: _inputDecoration(context.translate('age')),
              ),
            ),
            _fieldRow(
              icon: Icons.school_outlined,
              label: context.translate('school_name'),
              child: TextField(
                controller: _schoolNameCtrl,
                decoration: _inputDecoration(context.translate('school_name')),
              ),
            ),
            _fieldRow(
              icon: Icons.wc_rounded,
              label: context.translate('gender'),
              child: DropdownButtonFormField<String>(
                value: _selectedGender,
                decoration: _inputDecoration(context.translate('gender')),
                items: [
                  DropdownMenuItem(
                    value: 'male',
                    child: Text(context.translate('male')),
                  ),
                  DropdownMenuItem(
                    value: 'female',
                    child: Text(context.translate('female')),
                  ),
                ],
                onChanged: (v) => setState(() => _selectedGender = v),
              ),
            ),
            _fieldRow(
              icon: Icons.location_on_outlined,
              label: context.translate('city'),
              child: Autocomplete<String>(
                initialValue: TextEditingValue(text: _selectedCity ?? ''),
                optionsBuilder: (TextEditingValue textEditingValue) {
                  if (textEditingValue.text.isEmpty) {
                    return const Iterable<String>.empty();
                  }
                  return _moroccanCities.where((String option) {
                    return option.toLowerCase().contains(
                      textEditingValue.text.toLowerCase(),
                    );
                  });
                },
                onSelected: (String selection) {
                  setState(() => _selectedCity = selection);
                },
                fieldViewBuilder:
                    (context, controller, focusNode, onFieldSubmitted) {
                      return TextField(
                        controller: controller,
                        focusNode: focusNode,
                        decoration: _inputDecoration(context.translate('city')),
                        onChanged: (v) => setState(() => _selectedCity = v),
                      );
                    },
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isSavingProfile ? null : _saveProfile,
                icon: _isSavingProfile
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.save_rounded),
                label: Text(
                  _isSavingProfile
                      ? context.translate('saving')
                      : context.translate('save_changes'),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),

        // Preferences section
        _sectionCard(
          title: context.translate('preferences'),
          children: [
            // Language
            ListTile(
              leading: const Icon(
                Icons.language_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('language'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                currentLocale.languageCode == 'ar'
                    ? 'العربية'
                    : (currentLocale.languageCode == 'fr'
                          ? 'Français'
                          : 'English'),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => _showLanguageDialog(currentLocale),
            ),
            // Dark mode
            SwitchListTile(
              secondary: Icon(
                themeMode == ThemeMode.dark
                    ? Icons.dark_mode_rounded
                    : Icons.light_mode_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('dark_mode'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              value: themeMode == ThemeMode.dark,
              activeColor: AppColors.primary,
              onChanged: (_) => ref.read(themeProvider.notifier).toggleTheme(),
            ),
            // Ads Toggle
            SwitchListTile(
              secondary: const Icon(
                Icons.ads_click_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('enable_ads'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(context.translate('ads_subtitle')),
              value: ref.watch(preferencesProvider).isAdsEnabled(),
              activeColor: AppColors.primary,
              onChanged: (value) async {
                await ref.read(preferencesProvider).saveAdsEnabled(value);
                // Force rebuild of settings screen to reflect change
                setState(() {});
              },
            ),
            // Eye Care Toggle
            SwitchListTile(
              secondary: const Icon(
                Icons.visibility_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('eye_care_reminder'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(context.translate('eye_care_subtitle')),
              value: ref.watch(preferencesProvider).isEyeCareEnabled(),
              activeColor: AppColors.primary,
              onChanged: (value) async {
                await ref.read(preferencesProvider).saveEyeCareEnabled(value);
                setState(() {});
              },
            ),
            // Notifications
            ListTile(
              leading: const Icon(
                Icons.notifications_active_outlined,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('notifications'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () => AppSettings.openAppSettings(
                type: AppSettingsType.notification,
              ),
            ),
          ],
        ),

        // Access
        _sectionCard(
          title: context.translate('access'),
          children: [
            ListTile(
              leading: const Icon(
                Icons.school_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('change_level'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(context.translate('change_level_subtitle')),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () =>
                  Navigator.of(context, rootNavigator: true).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => const ProfileSetupScreen(initialPage: 1),
                    ),
                  ),
            ),
          ],
        ),

        // Support
        _sectionCard(
          title: context.translate('support'),
          children: [
            ListTile(
              leading: const Icon(
                Icons.contact_support_outlined,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('contact_developer'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              trailing: const Icon(Icons.chevron_right_rounded),
              onTap: () async {
                final uri = Uri(
                  scheme: 'mailto',
                  path: 'support@darsy.app',
                  queryParameters: {'subject': 'App Feedback'},
                );
                try {
                  await launchUrl(uri);
                } catch (_) {}
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.info_outline_rounded,
                color: AppColors.primary,
              ),
              title: Text(
                context.translate('about_app'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(context.translate('about_app_subtitle')),
              trailing: const Icon(Icons.chevron_right_rounded),
            ),
          ],
        ),

        const SizedBox(height: 24),
      ],
    ).animate().fadeIn();
  }

  Widget _buildSecurityTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _sectionCard(
          title: context.translate('change_password'),
          children: [
            _fieldRow(
              icon: Icons.lock_outline_rounded,
              label: context.translate('current_password'),
              child: TextField(
                controller: _currentPasswordCtrl,
                obscureText: true,
                decoration: _inputDecoration(
                  context.translate('current_password_hint'),
                ),
              ),
            ),
            _fieldRow(
              icon: Icons.lock_reset_rounded,
              label: context.translate('new_password'),
              child: TextField(
                controller: _newPasswordCtrl,
                obscureText: true,
                decoration: _inputDecoration(
                  context.translate('new_password_hint'),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _isChangingPassword ? null : _changePassword,
                icon: _isChangingPassword
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.check_rounded),
                label: Text(
                  _isChangingPassword
                      ? context.translate('changing')
                      : context.translate('change_password'),
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
      ],
    ).animate().fadeIn();
  }

  Widget _buildBillingTab(String currentPlan) {
    final plans = [
      {
        'id': 'free',
        'name': context.translate('free_plan'),
        'monthlyPrice': 0,
        'yearlyPrice': 0,
        'features': [
          context.translate('free_f1'),
          context.translate('free_f2'),
          context.translate('free_f3'),
        ],
      },
      {
        'id': 'pro',
        'name': context.translate('pro_plan'),
        'monthlyPrice': 100,
        'yearlyPrice': 900,
        'features': [
          context.translate('pro_f1'),
          context.translate('pro_f2'),
          context.translate('pro_f3'),
        ],
        'badge': context.translate('recommended'),
        'color': AppColors.primary,
      },
      {
        'id': 'premium',
        'name': context.translate('premium_plan'),
        'monthlyPrice': 200,
        'yearlyPrice': 1900,
        'features': [
          context.translate('premium_f1'),
          context.translate('premium_f2'),
          context.translate('premium_f3'),
        ],
        'isPremium': true,
        'badge': 'PREMIUM',
        'color': const Color(0xFFD4AF37),
      },
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Billing cycle toggle
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _isYearly = false),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: !_isYearly
                          ? AppColors.primary
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Text(
                      context.translate('monthly'),
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: !_isYearly ? Colors.white : AppColors.primary,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _isYearly = true),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: _isYearly ? AppColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '${context.translate('yearly')} ',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: _isYearly ? Colors.white : AppColors.primary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: _isYearly
                                ? Colors.white.withValues(alpha: 0.3)
                                : AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            context.translate('save_percent'),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _isYearly
                                  ? Colors.white
                                  : AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Pricing plans
        ...plans.map((plan) {
          final planId = plan['id'] as String;
          final isActive = currentPlan == planId;
          final isRecommended = plan['recommended'] == true;
          final price = _isYearly
              ? plan['yearlyPrice'] as int
              : plan['monthlyPrice'] as int;

          return Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isActive
                        ? AppColors.primary
                        : (isRecommended
                              ? AppColors.primary.withValues(alpha: 0.3)
                              : Colors.grey.withValues(alpha: 0.15)),
                    width: isActive ? 2 : 1,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  color: plan['isPremium'] == true
                      ? const Color(0xFFFFFBEB)
                      : (isRecommended
                            ? AppColors.primary.withValues(alpha: 0.03)
                            : Theme.of(context).colorScheme.surface),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isRecommended)
                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            context.translate('recommended'),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  plan['name'] as String,
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Row(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.baseline,
                                  textBaseline: TextBaseline.alphabetic,
                                  children: [
                                    Text(
                                      '$price',
                                      style: const TextStyle(
                                        fontSize: 32,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const Text(
                                      ' DH',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    Text(
                                      _isYearly ? '/yr' : '/mo',
                                      style: const TextStyle(
                                        color: Colors.grey,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          if (isActive)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.green.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                context.translate('active'),
                                style: const TextStyle(
                                  color: Colors.green,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const Divider(height: 24),
                      ...(plan['features'] as List<dynamic>).map(
                        (feature) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              const Icon(
                                Icons.check_circle_outline_rounded,
                                size: 18,
                                color: Colors.green,
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(feature as String)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: (isActive || _isSubscribing)
                              ? null
                              : () => _subscribe(planId),
                          style: FilledButton.styleFrom(
                            backgroundColor: isRecommended
                                ? AppColors.primary
                                : null,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            isActive ? 'Current Plan' : 'Choose Plan',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .animate()
              .fadeIn(delay: (100 * plans.indexOf(plan)).ms)
              .slideY(begin: 0.1);
        }),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _sectionCard({
    required String title,
    required List<Widget> children,
    Color? titleColor,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.withValues(alpha: 0.1)),
        borderRadius: BorderRadius.circular(20),
        color: Theme.of(context).colorScheme.surface,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(
              title.toUpperCase(),
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
                color: titleColor ?? AppColors.primary,
              ),
            ),
          ),
          ...children,
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _fieldRow({
    required IconData icon,
    required String label,
    required Widget child,
  }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 15, color: AppColors.primary),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          child,
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary),
      ),
    );
  }

  void _showLanguageDialog(Locale currentLocale) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Select Language',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...{'en': 'English', 'ar': 'العربية', 'fr': 'Français'}.entries.map(
              (e) => ListTile(
                title: Text(
                  e.value,
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                trailing: e.key == currentLocale.languageCode
                    ? const Icon(
                        Icons.check_circle_rounded,
                        color: AppColors.primary,
                      )
                    : null,
                onTap: () {
                  ref
                      .read(languageProvider.notifier)
                      .setLanguage(Locale(e.key));
                  Navigator.pop(context);
                },
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
