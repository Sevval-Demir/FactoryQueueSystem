import 'package:flutter/material.dart';

import '../core/api/dio_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../services/api_error.dart';
import '../services/auth_service.dart';
import 'home_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.storage});

  final SecureStorageService storage;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _loading = false;

  late final AuthService _authService;

  @override
  void initState() {
    super.initState();
    _authService = AuthService(DioClient(widget.storage), widget.storage);
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      await _authService.login(
        phone: _phoneController.text.trim(),
        password: _passwordController.text,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => HomeScreen(storage: widget.storage)));
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(error))));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.sizeOf(context);

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFE8F4FF), Color(0xFFF6FAF8), Color(0xFFEAF1F8)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: size.height - 80),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 460),
                  child: Form(
                    key: _formKey,
                    child: Container(
                      padding: const EdgeInsets.all(22),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(.86),
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(color: Colors.white.withOpacity(.9)),
                        boxShadow: [
                          BoxShadow(color: Colors.blueGrey.withOpacity(.16), blurRadius: 30, offset: const Offset(0, 18)),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(colors: [Color(0xFF0F6DA8), Color(0xFF1D9A72)]),
                                  borderRadius: BorderRadius.circular(20),
                                  boxShadow: [BoxShadow(color: theme.colorScheme.primary.withOpacity(.28), blurRadius: 18, offset: const Offset(0, 8))],
                                ),
                                child: const Icon(Icons.local_shipping_rounded, color: Colors.white, size: 34),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Factory Queue Driver', style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
                                    const SizedBox(height: 4),
                                    Text('Sürücü giriş paneli', style: theme.textTheme.titleMedium?.copyWith(color: Colors.blueGrey.shade700, fontWeight: FontWeight.w600)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 30),
                          TextFormField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(labelText: 'Telefon', prefixIcon: Icon(Icons.phone_rounded), border: OutlineInputBorder()),
                            validator: (value) => value == null || value.trim().isEmpty ? 'Telefon boş olamaz' : null,
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _passwordController,
                            obscureText: _obscure,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _login(),
                            decoration: InputDecoration(
                              labelText: 'Şifre',
                              prefixIcon: const Icon(Icons.lock_rounded),
                              border: const OutlineInputBorder(),
                              suffixIcon: IconButton(
                                onPressed: () => setState(() => _obscure = !_obscure),
                                icon: Icon(_obscure ? Icons.visibility_rounded : Icons.visibility_off_rounded),
                              ),
                            ),
                            validator: (value) => value == null || value.isEmpty ? 'Şifre boş olamaz' : null,
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            height: 58,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                elevation: 10,
                                shadowColor: theme.colorScheme.primary.withOpacity(.35),
                                backgroundColor: theme.colorScheme.primary,
                                foregroundColor: theme.colorScheme.onPrimary,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                                textStyle: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900),
                              ),
                              onPressed: _loading ? null : _login,
                              icon: _loading
                                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : const Icon(Icons.login_rounded),
                              label: const Text('Giriş Yap'),
                            ),
                          ),
                          const SizedBox(height: 14),
                          Center(
                            child: TextButton(
                              onPressed: _loading
                                  ? null
                                  : () => Navigator.of(context).push(
                                        MaterialPageRoute(builder: (_) => RegisterScreen(storage: widget.storage)),
                                      ),
                              child: const Text('Hesabınız yok mu? Kayıt Ol'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
