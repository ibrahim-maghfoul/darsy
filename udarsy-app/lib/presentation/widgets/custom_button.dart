import 'package:flutter/material.dart';

enum CustomButtonVariant { primary, secondary }

class CustomButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final CustomButtonVariant variant;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? width;
  final double height;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final TextStyle? textStyle;

  const CustomButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.variant = CustomButtonVariant.primary,
    this.backgroundColor,
    this.foregroundColor,
    this.width,
    this.height = 56,
    this.padding = const EdgeInsets.symmetric(horizontal: 24),
    this.borderRadius = 12,
    this.textStyle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isPrimary = variant == CustomButtonVariant.primary;

    return SizedBox(
      width: width,
      height: height,
      child: isPrimary
          ? ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: backgroundColor ?? Colors.white,
                foregroundColor: foregroundColor ?? theme.primaryColor,
                padding: padding,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(borderRadius),
                ),
                elevation: 5,
              ),
              child: Text(
                text,
                style:
                    textStyle ??
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            )
          : TextButton(
              onPressed: onPressed,
              style: TextButton.styleFrom(
                foregroundColor: foregroundColor ?? Colors.white,
                padding: padding,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(borderRadius),
                ),
              ),
              child: Text(
                text,
                style:
                    textStyle ??
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ),
    );
  }
}
