import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/app_colors.dart';
import '../../core/services/data_service.dart';

class ContactScreen extends ConsumerStatefulWidget {
  const ContactScreen({super.key});

  @override
  ConsumerState<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends ConsumerState<ContactScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  bool _isSubmitting = false;
  bool _isSubmitted = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      await ref
          .read(dataServiceProvider)
          .sendFeedback(
            name: _nameController.text.trim(),
            email: _emailController.text.trim(),
            subject: _subjectController.text.trim(),
            message: _messageController.text.trim(),
          );
      setState(() {
        _isSubmitted = true;
        _isSubmitting = false;
      });
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('فشل إرسال الرسالة. حاول مرة أخرى'),
            backgroundColor: Colors.red.shade600,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('تواصل معنا'), centerTitle: true),
      body: _isSubmitted
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    size: 80,
                    color: Colors.green.shade400,
                  ).animate().scale(
                    begin: const Offset(0.5, 0.5),
                    duration: 400.ms,
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'تم إرسال رسالتك بنجاح!',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 12),
                  Text(
                    'سنرد عليك في أقرب وقت',
                    style: TextStyle(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                    ),
                  ).animate().fadeIn(delay: 400.ms),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text('رجوع'),
                  ),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildField(
                      _nameController,
                      'الاسم',
                      Icons.person_outline,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'ادخل الاسم' : null,
                    ),
                    const SizedBox(height: 16),
                    _buildField(
                      _emailController,
                      'البريد الإلكتروني',
                      Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'ادخل البريد';
                        if (!v.contains('@')) return 'بريد غير صالح';
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    _buildField(
                      _subjectController,
                      'الموضوع',
                      Icons.subject_outlined,
                    ),
                    const SizedBox(height: 16),
                    _buildField(
                      _messageController,
                      'الرسالة',
                      Icons.message_outlined,
                      maxLines: 5,
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'ادخل الرسالة' : null,
                    ),
                    const SizedBox(height: 28),
                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed: _isSubmitting ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: _isSubmitting
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text(
                                'إرسال',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                      ),
                    ),
                  ].animate(interval: 80.ms).fadeIn().slideY(begin: 0.05),
                ),
              ),
            ),
    );
  }

  Widget _buildField(
    TextEditingController ctrl,
    String label,
    IconData icon, {
    TextInputType? keyboardType,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    final theme = Theme.of(context);
    return TextFormField(
      controller: ctrl,
      keyboardType: keyboardType,
      maxLines: maxLines,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(
          icon,
          color: theme.colorScheme.onSurface.withOpacity(0.4),
        ),
        filled: true,
        fillColor: theme.colorScheme.onSurface.withOpacity(0.04),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: AppColors.primary, width: 2),
        ),
      ),
    );
  }
}
