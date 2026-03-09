import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/linear_percent_indicator.dart';
import 'package:flip_card/flip_card.dart';
import '../../core/app_colors.dart';
import '../providers/user_progress_provider.dart';

class ProgressCard extends ConsumerStatefulWidget {
  final UserProgressData data;

  const ProgressCard({super.key, required this.data});

  @override
  ConsumerState<ProgressCard> createState() => _ProgressCardState();
}

class _ProgressCardState extends ConsumerState<ProgressCard> {
  final GlobalKey<FlipCardState> _cardKey = GlobalKey<FlipCardState>();

  @override
  void initState() {
    super.initState();
    _autoFlipRoutine();
  }

  Future<void> _autoFlipRoutine() async {
    // Wait for initial render
    await Future.delayed(const Duration(milliseconds: 1000));
    if (!mounted) return;

    // Flip to back
    _cardKey.currentState?.toggleCard();

    // Show back for 1.5 seconds
    await Future.delayed(const Duration(milliseconds: 1500));
    if (!mounted) return;

    // Flip back to front
    _cardKey.currentState?.toggleCard();
  }

  @override
  Widget build(BuildContext context) {
    return FlipCard(
      key: _cardKey,
      direction: FlipDirection.HORIZONTAL,
      side: CardSide.FRONT,
      front: _buildFront(context),
      back: _buildBack(context),
    );
  }

  Widget _buildFront(BuildContext context) {
    final data = widget.data;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data.levelTitle ?? data.currentSubject,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Learning Time: ${data.formattedLearningTime}',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.8),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '${(data.globalProgress * 100).toInt()}%',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            LinearPercentIndicator(
              padding: EdgeInsets.zero,
              lineHeight: 8,
              percent: data.globalProgress.clamp(0.0, 1.0),
              backgroundColor: Colors.white.withValues(alpha: 0.2),
              progressColor: Colors.white,
              barRadius: const Radius.circular(10),
              animation: true,
              animationDuration: 1000,
            ),
            const SizedBox(height: 12),
            Text(
              '${data.itemsRemaining} items to reach your goal',
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 12,
                fontStyle: FontStyle.italic,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSimpleStat(
                  Icons.picture_as_pdf_rounded,
                  data.pdfCount,
                  data.totalPdfs,
                  'PDFs',
                ),
                _buildSimpleStat(
                  Icons.play_circle_fill_rounded,
                  data.videoCount,
                  data.totalVideos,
                  'Videos',
                ),
                _buildSimpleStat(
                  Icons.folder_open_rounded,
                  data.resourceCount,
                  data.totalResources,
                  'Resources',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBack(BuildContext context) {
    final data = widget.data;
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        gradient: AppColors.blueGradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Recently Visited',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 12),
            if (data.history.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 20),
                child: Center(
                  child: Text(
                    'No history yet',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                    ),
                  ),
                ),
              )
            else
              ...data.history.map(
                (page) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.history_rounded,
                        color: Colors.white70,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          page,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleStat(IconData icon, int count, int total, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 24),
        const SizedBox(height: 6),
        Text(
          '$count/$total',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.7),
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
