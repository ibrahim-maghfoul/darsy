import 'package:flutter/material.dart';
import 'package:flip_card/flip_card.dart';
import '../../core/app_colors.dart';

class GlassmorphicSubjectCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Gradient? gradient;
  final VoidCallback onTap;
  final double? progress;

  const GlassmorphicSubjectCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.gradient,
    required this.onTap,
    this.progress,
  });

  @override
  State<GlassmorphicSubjectCard> createState() =>
      _GlassmorphicSubjectCardState();
}

class _GlassmorphicSubjectCardState extends State<GlassmorphicSubjectCard> {
  bool _isPressed = false;

  @override
  Widget build(BuildContext context) {
    // Generate a consistent color based on title hash for the icon background
    final colors = [
      AppColors.primary,
      AppColors.secondary,
      AppColors.accent,
      Colors.orange,
      Colors.purple,
      Colors.teal,
    ];
    final colorIndex = widget.title.hashCode.abs() % colors.length;
    final iconColor = colors[colorIndex];

    return FlipCard(
      direction: FlipDirection.HORIZONTAL,
      side: CardSide.FRONT,
      front: _buildCardContent(iconColor, false),
      back: _buildCardContent(iconColor, true),
    );
  }

  Widget _buildCardContent(Color iconColor, bool isBack) {
    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _isPressed ? 0.95 : 1.0,
        duration: const Duration(milliseconds: 100),
        curve: Curves.easeInOut,
        child: Container(
          decoration: BoxDecoration(
            color: isBack
                ? Theme.of(context).colorScheme.surface.withValues(alpha: 0.9)
                : Theme.of(context).colorScheme.surface,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(
              color: isBack
                  ? iconColor.withValues(alpha: 0.3)
                  : Theme.of(context).dividerColor.withValues(alpha: 0.1),
              width: 1,
            ),
          ),
          child: Stack(
            children: [
              // Progress Indicator Top Left
              if (!isBack && widget.progress != null)
                Positioned(
                  top: 16,
                  left: 16,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 40,
                        height: 40,
                        child: CircularProgressIndicator(
                          value: widget.progress,
                          strokeWidth: 4,
                          backgroundColor: Theme.of(
                            context,
                          ).dividerColor.withValues(alpha: 0.1),
                          color: iconColor,
                        ),
                      ),
                      Text(
                        '${(widget.progress! * 100).round()}%',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: iconColor,
                        ),
                      ),
                    ],
                  ),
                ),

              // Icon Top Right
              Positioned(
                top: 16,
                right: 16,
                child: Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: iconColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(widget.icon, color: iconColor, size: 28),
                ),
              ),

              // Text
              Positioned(
                bottom: 16,
                left: 16,
                right: 16,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      isBack ? 'Click to Open' : widget.subtitle,
                      style: TextStyle(
                        color: isBack ? iconColor : AppColors.textGrey,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
