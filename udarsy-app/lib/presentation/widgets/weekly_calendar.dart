import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/app_colors.dart';

class WeeklyCalendarWidget extends StatefulWidget {
  final ValueChanged<DateTime>? onDateSelected;

  const WeeklyCalendarWidget({super.key, this.onDateSelected});

  @override
  State<WeeklyCalendarWidget> createState() => _WeeklyCalendarWidgetState();
}

class _WeeklyCalendarWidgetState extends State<WeeklyCalendarWidget> {
  late DateTime _currentWeekStart;
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _selectedDate = DateTime(now.year, now.month, now.day);
    // Find the start of the week (e.g., Sunday or Monday)
    // Let's assume week starts on Sunday for this design like the screenshot
    // .weekday returns 1 for Mon, 7 for Sun.
    // If we want Sunday start:
    // If today is Monday(1), diff is 1. Start is Now-1.
    // If today is Sunday(7), diff is 0. Start is Now.
    // Actually DateTime.sunday is 7.
    // Let's make it simple: default to current date's week.

    // Adjust to get Sunday of the current week
    // weekday 7 is Sunday.
    // If today is Sunday, we want today.
    // If today is Monday(1), we want yesterday.

    // int daysToSubtract = now.weekday % 7; // Sunday(7)%7 = 0. Monday(1)%7 = 1.
    // _currentWeekStart = now.subtract(Duration(days: daysToSubtract));

    // Just stick to the screenshot design, likely S M T W T F S
    _currentWeekStart = _getStartOfWeek(now);
  }

  DateTime _getStartOfWeek(DateTime date) {
    // Sunday start
    final daysToSubtract = date.weekday % 7;
    final start = date.subtract(Duration(days: daysToSubtract));
    return DateTime(start.year, start.month, start.day);
  }

  void _changeWeek(int days) {
    setState(() {
      _currentWeekStart = _currentWeekStart.add(Duration(days: days));
    });
  }

  void _selectDate(DateTime date) {
    setState(() {
      _selectedDate = date;
    });
    widget.onDateSelected?.call(date);
  }

  @override
  Widget build(BuildContext context) {
    final titleFormatted = DateFormat('MMMM yyyy').format(
      _currentWeekStart.add(const Duration(days: 3)),
    ); // Use mid-week for month name? Or just start? Screenshot says July 2025.
    // Usually the month is determined by the majority of days or just the start. Let's use start.

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                titleFormatted,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left_rounded),
                    onPressed: () => _changeWeek(-7),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.grey.withOpacity(0.1),
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(32, 32),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.chevron_right_rounded),
                    onPressed: () => _changeWeek(7),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.grey.withOpacity(0.1),
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(32, 32),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Days Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(7, (index) {
            final date = _currentWeekStart.add(Duration(days: index));
            final isSelected = _isSameDay(date, _selectedDate);
            final isToday = _isSameDay(date, DateTime.now());

            return _buildDayItem(date, isSelected, isToday);
          }),
        ),
      ],
    );
  }

  Widget _buildDayItem(DateTime date, bool isSelected, bool isToday) {
    return GestureDetector(
      onTap: () => _selectDate(date),
      child: Column(
        children: [
          Text(
            DateFormat('E').format(date).substring(0, 3), // Sun, Mon...
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected ? Colors.black : Colors.transparent,
              border: isSelected
                  ? null
                  : Border.all(
                      color: isToday
                          ? AppColors.primary
                          : Colors.grey.withOpacity(0.3),
                      width: isToday
                          ? 2
                          : 1, // Highlight today if not selected, or just border
                    ),
            ),
            alignment: Alignment.center,
            child: Text(
              date.day.toString(),
              style: TextStyle(
                color: isSelected
                    ? Colors.white
                    : Theme.of(context).textTheme.bodyMedium?.color,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}
