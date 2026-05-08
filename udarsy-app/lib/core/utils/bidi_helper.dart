import 'package:flutter/material.dart';

class BidiHelper {
  /// Returns true if the text contains Arabic characters.
  static bool isArabic(String text) {
    if (text.isEmpty) return false;
    // Arabic unicode range: \u0600-\u06FF
    return RegExp(r'[\u0600-\u06FF]').hasMatch(text);
  }

  /// Returns TextDirection.rtl if the text is Arabic, otherwise TextDirection.ltr.
  static TextDirection getDirection(String text) {
    return isArabic(text) ? TextDirection.rtl : TextDirection.ltr;
  }

  /// Returns TextAlign.right if the text is Arabic, otherwise TextAlign.left.
  static TextAlign getTextAlign(String text) {
    return isArabic(text) ? TextAlign.right : TextAlign.left;
  }
}
