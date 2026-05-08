import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class SubjectIcons {
  static IconData getIconForSubject(String subjectTitle) {
    final lowerTitle = subjectTitle.toLowerCase();

    // Mathematics
    if (lowerTitle.contains('math') ||
        lowerTitle.contains('calcul') ||
        lowerTitle.contains('algèbre') ||
        lowerTitle.contains('algebra') ||
        lowerTitle.contains('géométrie') ||
        lowerTitle.contains('geometry') ||
        lowerTitle.contains('رياضيات')) {
      return CupertinoIcons.function;
    }

    // Sciences (Physics, Chemistry, Biology, Natural Sciences)
    if (lowerTitle.contains('physi') ||
        lowerTitle.contains('chimi') ||
        lowerTitle.contains('chemi') ||
        lowerTitle.contains('biolog') ||
        lowerTitle.contains('science') ||
        lowerTitle.contains('svt') ||
        lowerTitle.contains('naturel')) {
      return CupertinoIcons.lab_flask;
    }

    // History
    if (lowerTitle.contains('histoir') ||
        lowerTitle.contains('history') ||
        lowerTitle.contains('تاريخ')) {
      return CupertinoIcons.clock_fill;
    }

    // Geography
    if (lowerTitle.contains('géogra') ||
        lowerTitle.contains('geogra') ||
        lowerTitle.contains('جغرافيا')) {
      return CupertinoIcons.globe;
    }

    // Languages (French, English, Arabic, etc.)
    if (lowerTitle.contains('français') ||
        lowerTitle.contains('french') ||
        lowerTitle.contains('english') ||
        lowerTitle.contains('anglais') ||
        lowerTitle.contains('arabe') ||
        lowerTitle.contains('arabic') ||
        lowerTitle.contains('langue') ||
        lowerTitle.contains('language') ||
        lowerTitle.contains('لغة')) {
      return CupertinoIcons.textformat;
    }

    // Philosophy
    if (lowerTitle.contains('philoso') || lowerTitle.contains('فلسفة')) {
      return CupertinoIcons.lightbulb;
    }

    // Islamic Education / Religion
    if (lowerTitle.contains('islam') ||
        lowerTitle.contains('religion') ||
        lowerTitle.contains('تربية إسلامية')) {
      return CupertinoIcons.book;
    }

    // Computer Science / IT
    if (lowerTitle.contains('informatique') ||
        lowerTitle.contains('computer') ||
        lowerTitle.contains('programming') ||
        lowerTitle.contains('معلوماتية')) {
      return CupertinoIcons.desktopcomputer;
    }

    // Arts / Drawing
    if (lowerTitle.contains('art') ||
        lowerTitle.contains('dessin') ||
        lowerTitle.contains('drawing') ||
        lowerTitle.contains('فن')) {
      return CupertinoIcons.paintbrush;
    }

    // Music
    if (lowerTitle.contains('musique') ||
        lowerTitle.contains('music') ||
        lowerTitle.contains('موسيقى')) {
      return CupertinoIcons.music_note;
    }

    // Physical Education / Sports
    if (lowerTitle.contains('sport') ||
        lowerTitle.contains('éducation physique') ||
        lowerTitle.contains('physical education') ||
        lowerTitle.contains('رياضة')) {
      return CupertinoIcons.sportscourt;
    }

    // Economics
    if (lowerTitle.contains('économi') ||
        lowerTitle.contains('economi') ||
        lowerTitle.contains('اقتصاد')) {
      return CupertinoIcons.chart_bar;
    }

    // Literature
    if (lowerTitle.contains('littérature') ||
        lowerTitle.contains('literature') ||
        lowerTitle.contains('أدب')) {
      return CupertinoIcons.text_quote;
    }

    // Default fallback icon
    return CupertinoIcons.book_fill;
  }

  static Color getColorForSubject(String subjectTitle) {
    final lowerTitle = subjectTitle.toLowerCase();

    if (lowerTitle.contains('math')) {
      return const Color(0xFF2196F3); // Blue
    } else if (lowerTitle.contains('physi') || lowerTitle.contains('chimi')) {
      return const Color(0xFF4CAF50); // Green
    } else if (lowerTitle.contains('histoir') ||
        lowerTitle.contains('history')) {
      return const Color(0xFF9C27B0); // Purple
    } else if (lowerTitle.contains('langue') ||
        lowerTitle.contains('language')) {
      return const Color(0xFFFF9800); // Orange
    } else if (lowerTitle.contains('géogra') || lowerTitle.contains('geogra')) {
      return const Color(0xFF00BCD4); // Cyan
    } else if (lowerTitle.contains('philoso')) {
      return const Color(0xFF607D8B); // Blue Grey
    } else if (lowerTitle.contains('islam') ||
        lowerTitle.contains('religion')) {
      return const Color(0xFF009688); // Teal
    } else if (lowerTitle.contains('informatique') ||
        lowerTitle.contains('computer')) {
      return const Color(0xFF673AB7); // Deep Purple
    } else if (lowerTitle.contains('art')) {
      return const Color(0xFFE91E63); // Pink
    } else if (lowerTitle.contains('sport')) {
      return const Color(0xFFFF5722); // Deep Orange
    } else if (lowerTitle.contains('économi') ||
        lowerTitle.contains('economi')) {
      return const Color(0xFF4CAF50); // Green
    }

    return const Color(0xFF6200EA); // Default purple
  }
}
