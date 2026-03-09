import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/app_colors.dart';
import '../providers/auth_provider.dart';
import '../providers/preferences_provider.dart';
import 'chat_screen.dart';

class ChatRoomsScreen extends ConsumerStatefulWidget {
  const ChatRoomsScreen({super.key});

  @override
  ConsumerState<ChatRoomsScreen> createState() => _ChatRoomsScreenState();
}

class _ChatRoomsScreenState extends ConsumerState<ChatRoomsScreen>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final authState = ref.watch(authProvider);
    final prefs = ref.watch(preferencesProvider);

    if (!authState.isAuthenticated) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.chat_bubble_outline_rounded,
                  size: 80,
                  color: AppColors.primary.withValues(alpha: 0.3),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Chat Rooms',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                Text(
                  'Sign in to join your school chat room and connect with classmates.',
                  style: TextStyle(fontSize: 16, color: AppColors.textGrey),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final user = authState.user!;
    // Prioritize Names over IDs to match the website's room logic
    final guidance =
        user.level?.guidance ??
        prefs.getGuidanceTitle() ??
        prefs.getSelectedGuidance() ??
        user.selectedPath?.guidanceId ??
        '';

    final level =
        user.level?.level ??
        prefs.getLevelTitle() ??
        prefs.getSelectedLevel() ??
        user.selectedPath?.levelId ??
        '';

    // Instead of showing a list of rooms, connect directly to their level room
    // The user wants to directly see one chat room.
    return ChatScreen(
      guidance: guidance,
      level: level,
      roomTitle: 'Support / Chat Room',
    );
  }
}
