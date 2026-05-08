import 'dart:io';
import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'explore_screen.dart';
import 'chat_rooms_screen.dart';
import 'profile_screen.dart';

import '../../core/app_colors.dart';
import '../providers/user_progress_provider.dart';
import '../providers/learning_time_provider.dart';
import '../../core/services/chat_service.dart';
import '../../core/services/eye_care_service.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _currentIndex = 0;
  late PageController _pageController;
  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;
  bool _isOffline = false;

  final List<Widget> _screens = [
    const HomeScreen(),
    const ExploreScreen(),
    const ChatRoomsScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _currentIndex);
    _initConnectivityListener();

    // Start tracking learning time
    ref.read(learningTimeProvider);

    // Track initial home visit
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_currentIndex == 0) {
        ref.read(userProgressProvider.notifier).addToHistory('Home');
      }

      // Start Eye Care Reminder
      ref.read(eyeCareServiceProvider).startTimer(context);
    });
  }

  void _initConnectivityListener() {
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((
      List<ConnectivityResult> results,
    ) async {
      bool isActuallyOffline =
          results.isEmpty ||
          results.every((result) => result == ConnectivityResult.none);

      if (isActuallyOffline) {
        try {
          final lookup = await InternetAddress.lookup(
            'google.com',
          ).timeout(const Duration(seconds: 2));
          if (lookup.isNotEmpty && lookup[0].rawAddress.isNotEmpty) {
            isActuallyOffline = false;
          }
        } catch (_) {}
      }

      if (isActuallyOffline && !_isOffline) {
        setState(() {
          _isOffline = true;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).clearMaterialBanners();
          ScaffoldMessenger.of(context).showMaterialBanner(
            MaterialBanner(
              content: const Text(
                'No internet connection',
                style: TextStyle(color: Colors.white),
              ),
              leading: const Icon(Icons.wifi_off_rounded, color: Colors.white),
              backgroundColor: AppColors.error,
              actions: [
                TextButton(
                  onPressed: () =>
                      ScaffoldMessenger.of(context).hideCurrentMaterialBanner(),
                  child: const Text(
                    'DISMISS',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          );
        }
      } else if (!isActuallyOffline && _isOffline) {
        setState(() {
          _isOffline = false;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).hideCurrentMaterialBanner();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Back online!'),
              backgroundColor: AppColors.success,
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
              margin: EdgeInsets.all(16),
            ),
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _connectivitySubscription.cancel();
    ref.read(eyeCareServiceProvider).stopTimer();
    super.dispose();
  }

  void _onTabTapped(int index) {
    // Allow Profile (3) when offline; block others
    if (_isOffline && index != 3) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Offline mode: Only Profile is available.'),
          backgroundColor: Colors.grey,
          duration: Duration(seconds: 1),
        ),
      );
      return;
    }

    setState(() {
      _currentIndex = index;
    });

    if (index == 0) {
      ref.read(userProgressProvider.notifier).addToHistory('Home');
    } else if (index == 1) {
      ref.read(userProgressProvider.notifier).addToHistory('News');
    } else if (index == 2) {
      ref.read(userProgressProvider.notifier).addToHistory('Chat');
      ref.read(chatServiceProvider.notifier).resetUnread();
    } else if (index == 3) {
      ref.read(userProgressProvider.notifier).addToHistory('Profile');
    }

    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutCubic,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) => setState(() {
          _currentIndex = index;
        }),
        physics: const NeverScrollableScrollPhysics(),
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Theme.of(context).colorScheme.surface,
          elevation: 0,
          selectedItemColor: AppColors.secondary,
          unselectedItemColor: AppColors.textGrey,
          showUnselectedLabels: false,
          showSelectedLabels: false,
          items: [
            BottomNavigationBarItem(
              icon: Icon(
                _currentIndex == 0
                    ? CupertinoIcons.house_fill
                    : CupertinoIcons.house,
              ),
              label: '',
            ),
            BottomNavigationBarItem(
              icon: Icon(
                _currentIndex == 1
                    ? CupertinoIcons.compass_fill
                    : CupertinoIcons.compass,
              ),
              label: '',
            ),
            BottomNavigationBarItem(
              icon: Badge(
                label: Text(
                  ref.watch(chatServiceProvider).unreadCount.toString(),
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
                isLabelVisible: ref.watch(chatServiceProvider).unreadCount > 0,
                child: Icon(
                  _currentIndex == 2
                      ? CupertinoIcons.chat_bubble_2_fill
                      : CupertinoIcons.chat_bubble_2,
                ),
              ),
              label: '',
            ),
            BottomNavigationBarItem(
              icon: Icon(
                _currentIndex == 3
                    ? CupertinoIcons.person_fill
                    : CupertinoIcons.person,
              ),
              label: '',
            ),
          ],
        ),
      ),
    );
  }
}
