import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

/// Reusable shimmer placeholder widgets for loading states.
class ShimmerWidgets {
  ShimmerWidgets._();

  static Widget _shimmerBase({
    required Widget child,
    required BuildContext context,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey[800]! : Colors.grey[300]!,
      highlightColor: isDark ? Colors.grey[700]! : Colors.grey[100]!,
      child: child,
    );
  }

  /// Shimmer placeholder for a single subject card
  static Widget subjectCard(BuildContext context) {
    return _shimmerBase(
      context: context,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
      ),
    );
  }

  /// Shimmer grid of subject cards
  static Widget subjectGrid(BuildContext context, {int count = 4}) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.0,
      ),
      itemCount: count,
      itemBuilder: (context, _) => subjectCard(context),
    );
  }

  /// Shimmer placeholder for a header row (avatar + name)
  static Widget headerRow(BuildContext context) {
    return _shimmerBase(
      context: context,
      child: Row(
        children: [
          const CircleAvatar(radius: 28, backgroundColor: Colors.white),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 140,
                height: 18,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 6),
              Container(
                width: 100,
                height: 12,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Shimmer placeholder for a progress / stat card
  static Widget progressCard(BuildContext context) {
    return _shimmerBase(
      context: context,
      child: Container(
        height: 160,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  /// Shimmer placeholder for a news card
  static Widget newsCard(BuildContext context) {
    return _shimmerBase(
      context: context,
      child: Container(
        height: 120,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }

  /// Shimmer list of news cards
  static Widget newsList(BuildContext context, {int count = 3}) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(children: List.generate(count, (_) => newsCard(context))),
    );
  }

  /// Shimmer for a generic list tile
  static Widget listTile(BuildContext context) {
    return _shimmerBase(
      context: context,
      child: Container(
        height: 72,
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }

  /// Shimmer for profile stat cards row
  static Widget statsRow(BuildContext context) {
    return _shimmerBase(
      context: context,
      child: Row(
        children: List.generate(
          3,
          (_) => Expanded(
            child: Container(
              height: 80,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
