import 'package:flutter/material.dart';

import '../core/storage/secure_storage_service.dart';
import 'home_screen.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, required this.storage});

  final SecureStorageService storage;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    final token = await widget.storage.readToken();
    final userId = await widget.storage.readUserId();
    final role = await widget.storage.readRole();

    if (!mounted) return;

    if (token != null && userId != null && role?.toLowerCase() == 'driver') {
      Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => HomeScreen(storage: widget.storage)));
      return;
    }

    await widget.storage.clear();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => LoginScreen(storage: widget.storage)));
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: SafeArea(
        child: Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
