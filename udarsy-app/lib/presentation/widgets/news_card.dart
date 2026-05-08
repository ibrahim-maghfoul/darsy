import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/auth_provider.dart';
import '../providers/user_progress_provider.dart';
import '../../data/models/news_model.dart';
import '../../core/app_colors.dart';

import '../screens/news_detail_screen.dart';
import '../widgets/styled_snackbar.dart';
import '../../core/utils/bidi_helper.dart';

class LiquidNotchCard extends StatelessWidget {
  final NewsModel news;

  const LiquidNotchCard({super.key, required this.news});

  static const double pillHeight = 38;
  static const double pillWidthFactor = 0.28;
  static const double notchRadius = 25; // The "scoop" size
  static const double gap = 8; // Gap between pill and card
  static const double cardRadius = 24;

  @override
  Widget build(BuildContext context) {
    final double cardWidth = 340;
    final double pillWidth = cardWidth * pillWidthFactor;
    // Colors - Always White card with Primary green border
    const cardColor = Colors.white;
    const pillColor = AppColors.primary;
    const textColor = Color(0xFF1A1A1A);
    const pillTextColor = Colors.white;

    return SizedBox(
      width: cardWidth,
      height: 380, // Fixed height to ensure layout stability
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          /// CARD BACKGROUND WITH CUSTOM CLIPPER AND PAINTER
          Positioned.fill(
            child: GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => NewsDetailScreen(news: news),
                  ),
                );
              },
              child: Stack(
                children: [
                  // Draw the border (contour)
                  CustomPaint(
                    size: Size.infinite,
                    painter: _LiquidNotchPainter(
                      pillWidth: pillWidth,
                      pillHeight: pillHeight,
                      notchRadius: notchRadius,
                      gap: gap,
                      cardRadius: cardRadius,
                      color: AppColors.primary,
                      strokeWidth: 2,
                    ),
                  ),
                  // Clip the content
                  ClipPath(
                    clipper: _LiquidNotchClipper(
                      pillWidth: pillWidth,
                      pillHeight: pillHeight,
                      notchRadius: notchRadius,
                      gap: gap,
                      cardRadius: cardRadius,
                    ),
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
                      color: cardColor,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          /// TOP TEXT SECTION
                          Padding(
                            padding: EdgeInsets.only(
                              left: pillWidth + gap + 8,
                              top: 4,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  news.category.toUpperCase(),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black54,
                                    letterSpacing: 1.1,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  news.title,
                                  textAlign: BidiHelper.getTextAlign(
                                    news.title,
                                  ),
                                  textDirection: BidiHelper.getDirection(
                                    news.title,
                                  ),
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: textColor,
                                    height: 1.2,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),

                          /// IMAGE
                          Expanded(
                            child: Container(
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Hero(
                                  tag: 'news_image_${news.id}',
                                  child: CachedNetworkImage(
                                    imageUrl: news.imageUrl,
                                    fit: BoxFit.cover,
                                    width: double.infinity,
                                    placeholder: (context, url) => Container(
                                      color: Colors.white54,
                                      child: const Center(
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                        ),
                                      ),
                                    ),
                                    errorWidget: (context, url, error) =>
                                        Container(
                                          color: Colors.white54,
                                          child: const Icon(
                                            Icons.broken_image_rounded,
                                          ),
                                        ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 16),

                          /// BOTTOM TEXT SECTION
                          Padding(
                            padding: EdgeInsets.only(
                              right: pillWidth + gap + 8,
                              bottom: 4,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  news.description,
                                  textAlign: BidiHelper.getTextAlign(
                                    news.description,
                                  ),
                                  textDirection: BidiHelper.getDirection(
                                    news.description,
                                  ),
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.black87,
                                    fontWeight: FontWeight.w500,
                                    height: 1.4,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.calendar_today_rounded,
                                      size: 12,
                                      color: Colors.black45,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      news.timeAgo,
                                      style: const TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.black45,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          /// TOP LEFT PILL
          Positioned(
            top: 0,
            left: 0,
            child: Container(
              height: pillHeight,
              width: pillWidth,
              decoration: BoxDecoration(
                color: pillColor,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: Consumer(
                  builder: (context, ref, child) {
                    final savedNews =
                        ref.watch(authProvider).user?.progress?.savedNews ?? [];
                    final isFavorited = savedNews.contains(news.id);

                    return InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () {
                        ref
                            .read(userProgressProvider.notifier)
                            .toggleNewsFavorite(news.id);

                        if (isFavorited) {
                          StyledSnackBar.showSuccess(
                            context,
                            'Removed from favorites',
                          );
                        } else {
                          StyledSnackBar.showFavoriteSuccess(
                            context,
                            'Added to favorites',
                          );
                        }
                      },
                      child: Center(
                        child: Icon(
                          isFavorited
                              ? Icons.favorite_rounded
                              : Icons.favorite_border_rounded,
                          size: 18,
                          color: isFavorited ? Colors.white : pillTextColor,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          /// BOTTOM RIGHT PILL
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              height: pillHeight,
              width: pillWidth,
              decoration: BoxDecoration(
                color: pillColor,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    'Read More',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: pillTextColor,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward_rounded,
                    size: 14,
                    color: pillTextColor,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

Path _getNotchedPath({
  required Size size,
  required double pillWidth,
  required double pillHeight,
  required double notchRadius,
  required double gap,
  required double cardRadius,
}) {
  final path = Path();
  final w = size.width;
  final h = size.height;

  // Calculate cut dimensions including gap
  final cutW = pillWidth + gap;
  final cutH = pillHeight + gap;
  final r = notchRadius;

  // Start at Top-Left, below the notch
  path.moveTo(0, cutH + r);

  // 1. TL Notch: Vertical Scoop
  path.quadraticBezierTo(0, cutH, r, cutH);

  // 2. TL Notch: Horizontal line
  path.lineTo(cutW - r, cutH);

  // 3. TL Notch: Corner Scoop
  path.quadraticBezierTo(cutW, cutH, cutW, cutH - r);

  // 4. TL Notch: Vertical line up
  path.lineTo(cutW, r);

  // 5. TL Notch: Top Scoop
  path.quadraticBezierTo(cutW, 0, cutW + r, 0);

  // 6. Top Edge -> Top Right Corner
  path.lineTo(w - cardRadius, 0);
  path.quadraticBezierTo(w, 0, w, cardRadius);

  // 7. Right Edge -> Bottom Right Notch start
  path.lineTo(w, h - cutH - r);

  // 8. BR Notch: Vertical Scoop
  path.quadraticBezierTo(w, h - cutH, w - r, h - cutH);

  // 9. BR Notch: Horizontal line
  path.lineTo(w - cutW + r, h - cutH);

  // 10. BR Notch: Corner Scoop
  path.quadraticBezierTo(w - cutW, h - cutH, w - cutW, h - cutH + r);

  // 11. BR Notch: Vertical line down
  path.lineTo(w - cutW, h - r);

  // 12. BR Notch: Bottom Scoop
  path.quadraticBezierTo(w - cutW, h, w - cutW - r, h);

  // 13. Bottom Edge -> Bottom Left Corner
  path.lineTo(cardRadius, h);
  path.quadraticBezierTo(0, h, 0, h - cardRadius);

  // Close
  path.close();
  return path;
}

class _LiquidNotchPainter extends CustomPainter {
  final double pillWidth;
  final double pillHeight;
  final double notchRadius;
  final double gap;
  final double cardRadius;
  final Color color;
  final double strokeWidth;

  _LiquidNotchPainter({
    required this.pillWidth,
    required this.pillHeight,
    required this.notchRadius,
    required this.gap,
    required this.cardRadius,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeJoin = StrokeJoin.round;

    final path = _getNotchedPath(
      size: size,
      pillWidth: pillWidth,
      pillHeight: pillHeight,
      notchRadius: notchRadius,
      gap: gap,
      cardRadius: cardRadius,
    );

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _LiquidNotchPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
}

class _LiquidNotchClipper extends CustomClipper<Path> {
  final double pillWidth;
  final double pillHeight;
  final double notchRadius;
  final double gap;
  final double cardRadius;

  _LiquidNotchClipper({
    required this.pillWidth,
    required this.pillHeight,
    required this.notchRadius,
    required this.gap,
    required this.cardRadius,
  });

  @override
  Path getClip(Size size) {
    return _getNotchedPath(
      size: size,
      pillWidth: pillWidth,
      pillHeight: pillHeight,
      notchRadius: notchRadius,
      gap: gap,
      cardRadius: cardRadius,
    );
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => true;
}
