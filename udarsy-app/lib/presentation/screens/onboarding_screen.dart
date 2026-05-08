import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:liquid_swipe/liquid_swipe.dart';
import '../../core/app_colors.dart';
import '../../core/constants.dart';
import '../providers/preferences_provider.dart';
import '../widgets/custom_button.dart';
import '../../core/services/first_launch_service.dart';
import 'login_screen.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});

  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  LiquidController? _liquidController;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _liquidController = LiquidController();
  }

  final List<OnboardingData> _pages = [
    OnboardingData(
      title: AppStrings.onboardingTitle1,
      description: AppStrings.onboardingDesc1,
      icon: Icons.auto_stories_rounded,
      color: AppColors.primary,
    ),
    OnboardingData(
      title: AppStrings.onboardingTitle2,
      description: AppStrings.onboardingDesc2,
      icon: Icons.download_for_offline_rounded,
      color: AppColors.secondary,
    ),
    OnboardingData(
      title: AppStrings.onboardingTitle3,
      description: AppStrings.onboardingDesc3,
      icon: Icons.quiz_rounded,
      color: AppColors.accent,
    ),
  ];

  void _onNext() {
    if (_currentPage < _pages.length - 1) {
      _liquidController?.animateToPage(page: _currentPage + 1, duration: 600);
    }
  }

  Future<void> _finishOnboarding() async {
    final prefs = ref.read(preferencesProvider);
    await prefs.setOnboardingCompleted();

    final firstLaunchService = FirstLaunchService();
    await firstLaunchService.setFirstLaunchComplete();

    if (!mounted) return;
    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          LiquidSwipe(
            pages: _pages.map((data) => OnboardingPage(data: data)).toList(),
            liquidController: _liquidController,
            onPageChangeCallback: (index) {
              setState(() => _currentPage = index);
            },
            enableLoop: false,
            waveType: WaveType.liquidReveal,
            enableSideReveal: true,
            slideIconWidget: const Icon(
              Icons.arrow_back_ios,
              color: Colors.white,
            ),
          ),

          if (_currentPage < _pages.length - 1)
            Positioned(
              top: 60,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.swipe, color: Colors.white, size: 16),
                      SizedBox(width: 8),
                      Text(
                        'Swipe to explore',
                        style: TextStyle(color: Colors.white, fontSize: 14),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          if (_currentPage == _pages.length - 1)
            Positioned(
              bottom: 50,
              left: 40,
              right: 40,
              child: CustomButton(
                text: 'Get Started',
                onPressed: _finishOnboarding,
                backgroundColor: Colors.white,
                foregroundColor: _pages[_currentPage].color,
                width: double.infinity,
              ),
            ),

          if (_currentPage < _pages.length - 1)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Indicator dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _pages.length,
                          (index) => AnimatedContainer(
                            duration: const Duration(milliseconds: 300),
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            height: 8,
                            width: _currentPage == index ? 24 : 8,
                            decoration: BoxDecoration(
                              color: _currentPage == index
                                  ? Colors.white
                                  : Colors.white.withValues(alpha: 0.3),
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Buttons
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          CustomButton(
                            text: AppStrings.skip,
                            onPressed: _finishOnboarding,
                            variant: CustomButtonVariant.secondary,
                            padding: EdgeInsets.zero,
                            height: 48,
                            textStyle: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                              fontSize: 16,
                            ),
                            foregroundColor: Colors.white,
                          ),
                          CustomButton(
                            text: AppStrings.next,
                            onPressed: _onNext,
                            variant: CustomButtonVariant.secondary,
                            padding: EdgeInsets.zero,
                            height: 48,
                            textStyle: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                            foregroundColor: Colors.white,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class OnboardingData {
  final String title;
  final String description;
  final IconData icon;
  final Color color;

  OnboardingData({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });
}

class OnboardingPage extends StatelessWidget {
  final OnboardingData data;

  const OnboardingPage({super.key, required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: data.color,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [data.color, data.color],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(30),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(data.icon, size: 100, color: data.color),
            ).animate().scale(duration: 600.ms, curve: Curves.easeOut),
            const SizedBox(height: 48),
            Text(
              data.title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0),
            const SizedBox(height: 16),
            Text(
              data.description,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 16,
                color: Colors.white,
                height: 1.5,
              ),
            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2, end: 0),
          ],
        ),
      ),
    );
  }
}
