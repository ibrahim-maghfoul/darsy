import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/app_colors.dart';
import '../../core/constants.dart';
import '../providers/auth_provider.dart';
import '../providers/lessons_provider.dart';
import '../providers/preferences_provider.dart';
import '../providers/user_progress_provider.dart';
import '../widgets/custom_button.dart';
import '../widgets/styled_snackbar.dart';
import 'main_screen.dart';

class ProfileSetupScreen extends ConsumerStatefulWidget {
  final int initialPage;
  const ProfileSetupScreen({super.key, this.initialPage = 0});

  @override
  ConsumerState<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends ConsumerState<ProfileSetupScreen> {
  late final PageController _pageController;
  late final ScrollController _scrollController;
  int _currentPage = 0;

  // Selection state
  String? _selectedSchoolId;
  String? _selectedLevelId;
  String? _selectedGuidanceId;
  String? _profilePicPath;

  // Account Setup State
  final _cityController = TextEditingController();
  final _mobileController = TextEditingController();
  String? _selectedAge;
  String? _selectedGender;
  bool _isAccountFormValid = false;

  @override
  void initState() {
    super.initState();
    _currentPage = widget.initialPage;
    _pageController = PageController(initialPage: _currentPage);
    _scrollController = ScrollController();
    _cityController.addListener(_checkAccountFormValidity);

    // Pre-load current selections if any
    _selectedSchoolId = ref.read(selectedSchoolProvider);
    _selectedLevelId = ref.read(selectedLevelProvider);
    _selectedGuidanceId = ref.read(selectedGuidanceProvider);
  }

  @override
  void dispose() {
    _cityController.dispose();
    _mobileController.dispose();
    _pageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _checkAccountFormValidity() {
    final isValid =
        _cityController.text.isNotEmpty &&
        _selectedAge != null &&
        _selectedGender != null;
    if (isValid != _isAccountFormValid) {
      setState(() => _isAccountFormValid = isValid);
    }
  }

  void _onNext() {
    if (_currentPage == 0) {
      if (_isAccountFormValid) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    } else {
      _finishSetup();
    }
  }

  void _finishSetup() async {
    if (!_isSelectionValid()) {
      String extraMsg = 'Please complete your selection';
      if (_selectedSchoolId == null)
        extraMsg = 'Please select a school.';
      else if (_selectedLevelId == null)
        extraMsg = 'Please select a level.';
      else if (_selectedGuidanceId == null)
        extraMsg = 'Please select a guidance path.';

      StyledSnackBar.showInfo(context, extraMsg);
      return;
    }

    final prefs = ref.read(preferencesProvider);
    final userNotifier = ref.read(userProgressProvider.notifier);
    final authState = ref.read(authProvider);

    try {
      final selectedSchool = ref
          .read(schoolsProvider)
          .value
          ?.firstWhere(
            (s) => s.id == _selectedSchoolId,
            orElse: () => throw Exception('School not found'),
          );

      final name = authState.user?.displayName ?? '';
      final nickname = authState.user?.nickname ?? name;

      await ref.read(authProvider.notifier).updateProfile({
        'displayName': name,
        'nickname': nickname,
        'age': int.tryParse(_selectedAge ?? ''),
        'gender': _selectedGender?.toLowerCase(),
        'city': _cityController.text,
        'phone': _mobileController.text,
        if (selectedSchool != null) 'schoolName': selectedSchool.title,
      });

      await prefs.saveUserName(name);
      await prefs.saveNickname(nickname);
      await prefs.saveAge(_selectedAge ?? '');
      await prefs.saveGender(_selectedGender ?? '');
      await prefs.saveCity(_cityController.text);
      await prefs.saveMobile(_mobileController.text);
    } catch (e) {
      if (mounted) {
        StyledSnackBar.showError(
          context,
          'Failed to save profile on server: $e',
        );
      }
    }

    if (_profilePicPath != null) {
      try {
        await ref
            .read(authServiceProvider)
            .uploadProfilePicture(_profilePicPath!);
      } catch (_) {}
      await prefs.saveProfilePicture(_profilePicPath!);
    }

    await prefs.saveSelectedSchool(_selectedSchoolId!);
    await prefs.saveSelectedLevel(_selectedLevelId!);

    if (_selectedGuidanceId != null) {
      await prefs.saveSelectedGuidance(_selectedGuidanceId!);
    }

    final levelTitle = ref
        .read(levelsProvider)
        .value
        ?.firstWhere((l) => l.id == _selectedLevelId)
        .title;
    if (levelTitle != null) {
      await prefs.saveLevelTitle(levelTitle);
    }

    final guidanceTitle = ref
        .read(guidancesProvider)
        .value
        ?.firstWhere((g) => g.id == _selectedGuidanceId)
        .title;
    if (guidanceTitle != null) {
      await prefs.saveGuidanceTitle(guidanceTitle);
    }

    userNotifier.updateProfile(
      name: authState.user?.displayName ?? '',
      nickname: authState.user?.nickname ?? '',
      age: _selectedAge,
      genre: _selectedGender,
      city: _cityController.text,
      profilePicture: _profilePicPath,
      levelTitle: levelTitle,
    );
    ref.read(selectedSchoolProvider.notifier).set(_selectedSchoolId);
    ref.read(selectedLevelProvider.notifier).set(_selectedLevelId);
    ref.read(selectedGuidanceProvider.notifier).set(_selectedGuidanceId);

    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const MainScreen(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 800),
      ),
    );
  }

  bool _isSelectionValid() {
    if (_selectedSchoolId == null || _selectedLevelId == null) return false;

    final guidancesAsync = ref.read(guidancesProvider);
    return guidancesAsync.when(
      data: (guidances) {
        if (guidances.isEmpty) return true;

        final selectedSchoolList = ref.read(schoolsProvider).value;
        if (selectedSchoolList == null || selectedSchoolList.isEmpty)
          return true;

        final selectedSchool = selectedSchoolList.firstWhere(
          (s) => s.id == _selectedSchoolId,
        );
        final isLycee = selectedSchool.title.toLowerCase().contains('lyc');

        if (isLycee || guidances.length > 1) {
          return _selectedGuidanceId != null;
        }

        return true;
      },
      loading: () => true,
      error: (e, s) => true,
    );
  }

  void _scrollToSection() {
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      final croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1),
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Crop Profile Picture',
            toolbarColor: AppColors.primary,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true,
          ),
          IOSUiSettings(
            title: 'Crop Profile Picture',
            aspectRatioLockEnabled: true,
          ),
        ],
      );
      if (croppedFile != null) {
        setState(() => _profilePicPath = croppedFile.path);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          PageView(
            controller: _pageController,
            onPageChanged: (index) => setState(() => _currentPage = index),
            physics: const NeverScrollableScrollPhysics(),
            children: [_buildAccountSetupPage(), _buildSelectionPage()],
          ),
          Positioned(
            bottom: 50,
            left: 20,
            right: 20,
            child: Column(
              children: [
                // Indicators
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    2,
                    (index) => AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      height: 8,
                      width: _currentPage == index ? 24 : 8,
                      decoration: BoxDecoration(
                        color: _currentPage == index
                            ? AppColors.primary
                            : AppColors.grey.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),

                // Action Button
                CustomButton(
                  text: _currentPage == 1
                      ? AppStrings.getStarted
                      : AppStrings.next,
                  onPressed: (_currentPage == 0 && !_isAccountFormValid)
                      ? null
                      : () {
                          if (_currentPage == 0) {
                            if (_isAccountFormValid) _onNext();
                          } else {
                            _finishSetup();
                          }
                        },
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  width: double.infinity,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountSetupPage() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 120),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Complete Your Profile',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'We need a few more details to set up your account securely.',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.textDark.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 32),
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: AppColors.surfaceLight,
                    backgroundImage: _profilePicPath != null
                        ? FileImage(File(_profilePicPath!))
                        : null,
                    child: _profilePicPath == null
                        ? Icon(
                            _selectedGender == 'Female'
                                ? Icons.face_3_rounded
                                : Icons.face_6_rounded,
                            size: 60,
                            color: AppColors.grey,
                          )
                        : null,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: _pickImage,
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt_rounded,
                          size: 20,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: _buildDropdownField(
                    'Age',
                    _selectedAge,
                    List.generate(50, (i) => (i + 5).toString()),
                    (v) {
                      setState(() => _selectedAge = v);
                      _checkAccountFormValidity();
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildDropdownField(
                    'Gender',
                    _selectedGender,
                    ['Male', 'Female'],
                    (v) {
                      setState(() => _selectedGender = v);
                      _checkAccountFormValidity();
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildTextField(_cityController, 'City', Icons.location_city),
            const SizedBox(height: 16),
            _buildTextField(
              _mobileController,
              'Mobile (Optional)',
              Icons.phone_android,
              isPhone: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label,
    IconData icon, {
    bool isPhone = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        keyboardType: isPhone ? TextInputType.phone : TextInputType.text,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, color: AppColors.primary),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownField(
    String label,
    String? value,
    List<String> items,
    void Function(String?) onChanged,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: DropdownButtonFormField<String>(
        value: value,
        items: items
            .map((e) => DropdownMenuItem(value: e, child: Text(e.toString())))
            .toList(),
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(
            label == 'Age'
                ? Icons.calendar_today_rounded
                : Icons.transgender_rounded,
            color: AppColors.primary,
            size: 20,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.white,
        ),
      ),
    );
  }

  Widget _buildSelectionPage() {
    final schoolsAsync = ref.watch(schoolsProvider);
    final levelsAsync = ref.watch(levelsProvider);

    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 60, 24, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Customize Your Experience',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Select your school, level, and guidance to get personalized content.',
            style: TextStyle(
              fontSize: 16,
              color: AppColors.textDark.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 32),

          Expanded(
            child: ListView(
              controller: _scrollController,
              children: [
                // School Selection
                const Text(
                  'Select School',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
                const SizedBox(height: 16),
                schoolsAsync.when(
                  data: (schools) {
                    if (schools.isEmpty) {
                      return const Text('No schools available');
                    }
                    // Sort: Primaire → Collège → Lycée
                    final sorted = List.of(schools);
                    sorted.sort((a, b) {
                      int priority(String t) {
                        final l = t.toLowerCase();
                        if (l.contains('primaire') || l.contains('ابتدائي'))
                          return 0;
                        if (l.contains('collège') ||
                            l.contains('college') ||
                            l.contains('إعدادي'))
                          return 1;
                        if (l.contains('lycée') ||
                            l.contains('lycee') ||
                            l.contains('ثانوي'))
                          return 2;
                        return 3;
                      }

                      return priority(a.title).compareTo(priority(b.title));
                    });
                    return Column(
                      children: sorted.asMap().entries.map((entry) {
                        final index = entry.key;
                        final school = entry.value;
                        return _buildSelectionItem(
                          title: school.title,
                          isSelected: _selectedSchoolId == school.id,
                          index: index,
                          onTap: () {
                            setState(() {
                              _selectedSchoolId = school.id;
                              _selectedLevelId = null;
                              _selectedGuidanceId = null;
                              ref
                                  .read(selectedSchoolProvider.notifier)
                                  .set(school.id);
                            });
                            _scrollToSection();
                          },
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const Center(
                    child: Padding(
                      padding: EdgeInsets.all(16.0),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                  error: (e, st) => Text('Error: $e'),
                ),

                // Level Selection (only show if school is selected)
                if (_selectedSchoolId != null) ...[
                  const SizedBox(height: 32),
                  const Text(
                    'Select Level',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textDark,
                    ),
                  ),
                  const SizedBox(height: 16),
                  levelsAsync.when(
                    data: (levels) {
                      if (levels.isEmpty) {
                        return const Text(
                          'No levels available for this school',
                        );
                      }
                      return Column(
                        children: levels.asMap().entries.map((entry) {
                          final index = entry.key;
                          final level = entry.value;
                          return _buildSelectionItem(
                            title: level.title,
                            isSelected: _selectedLevelId == level.id,
                            index: index,
                            onTap: () {
                              setState(() {
                                _selectedLevelId = level.id;
                                _selectedGuidanceId = null;
                                ref
                                    .read(selectedLevelProvider.notifier)
                                    .set(level.id);
                              });
                              _scrollToSection();
                            },
                          );
                        }).toList(),
                      );
                    },
                    loading: () => const Center(
                      child: Padding(
                        padding: EdgeInsets.all(16.0),
                        child: CircularProgressIndicator(),
                      ),
                    ),
                    error: (e, st) => Text('Error: $e'),
                  ),
                ],

                // Guidance Selection (only show if level is selected)
                if (_selectedLevelId != null) ...[_buildGuidanceSection()],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGuidanceSection() {
    final guidancesAsync = ref.watch(guidancesProvider);

    return guidancesAsync.when(
      data: (guidances) {
        if (guidances.isEmpty) {
          return const SizedBox.shrink();
        }

        final selectedSchool = ref
            .watch(schoolsProvider)
            .value
            ?.where((s) => s.id == _selectedSchoolId)
            .firstOrNull;

        final isLycee =
            selectedSchool?.title.toLowerCase().contains('lyc') ?? false;

        if (!isLycee &&
            guidances.length == 1 &&
            guidances.first.title.toLowerCase().contains('gen')) {
          if (_selectedGuidanceId != guidances.first.id) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              setState(() => _selectedGuidanceId = guidances.first.id);
            });
          }
          return const SizedBox.shrink();
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 32),
            const Text(
              'Select Guidance',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.textDark,
              ),
            ),
            const SizedBox(height: 16),
            ...guidances.asMap().entries.map((entry) {
              final index = entry.key;
              final guidance = entry.value;
              return _buildSelectionItem(
                title: guidance.title,
                isSelected: _selectedGuidanceId == guidance.id,
                index: index,
                onTap: () {
                  setState(() {
                    _selectedGuidanceId = guidance.id;
                  });
                },
              );
            }),
          ],
        );
      },
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, stack) => Text('Error loading guidances: $err'),
    );
  }

  Widget _buildSelectionItem({
    required String title,
    required bool isSelected,
    required VoidCallback onTap,
    required int index,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: isSelected
                    ? AppColors.primary.withValues(alpha: 0.3)
                    : Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(
              color: isSelected
                  ? AppColors.primary
                  : Colors.grey.withValues(alpha: 0.1),
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Icon(
                isSelected ? Icons.check_circle_rounded : Icons.circle_outlined,
                color: isSelected ? Colors.white : AppColors.grey,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: isSelected
                        ? FontWeight.bold
                        : FontWeight.normal,
                    color: isSelected ? Colors.white : AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: (index * 50).ms).slideX(begin: 0.1, end: 0);
  }
}
