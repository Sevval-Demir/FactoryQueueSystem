import 'package:flutter/material.dart';

import '../core/api/dio_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../models/shipment.dart';
import '../services/api_error.dart';
import '../services/auth_service.dart';
import '../services/shipment_service.dart';
import '../widgets/primary_button.dart';
import '../widgets/shipment_status_card.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.storage});

  final SecureStorageService storage;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final ShipmentService _shipmentService;
  late final AuthService _authService;
  Shipment? _shipment;
  String _fullName = '';
  String? _driverId;
  bool _loading = true;
  bool _arriving = false;

  @override
  void initState() {
    super.initState();
    final client = DioClient(widget.storage);
    _shipmentService = ShipmentService(client);
    _authService = AuthService(client, widget.storage);
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    _fullName = await widget.storage.readFullName() ?? 'Sürücü';
    _driverId = await widget.storage.readUserId();
    await _refresh(showMessage: false);
  }

  Future<void> _refresh({bool showMessage = true}) async {
    final driverId = _driverId;
    if (driverId == null || driverId.isEmpty) {
      await _logout();
      return;
    }

    setState(() => _loading = true);
    try {
      final activeShipment = await _shipmentService.getActiveShipment(driverId);
      if (activeShipment != null) {
        if (mounted) setState(() => _shipment = activeShipment);
        return;
      }

      final currentShipment = _shipment;
      if (currentShipment != null) {
        final statusShipment = await _shipmentService.getShipmentStatus(currentShipment);
        if (mounted) setState(() => _shipment = statusShipment);
        return;
      }

      if (mounted) setState(() => _shipment = null);
    } catch (error) {
      if (mounted && showMessage) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(error))));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _arrive() async {
    final shipment = _shipment;
    if (shipment == null) return;

    setState(() => _arriving = true);
    try {
      await _shipmentService.arrive(shipment.id);
      await _refresh(showMessage: false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Tesise varışınız kaydedildi.')));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(error))));
      }
    } finally {
      if (mounted) setState(() => _arriving = false);
    }
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => LoginScreen(storage: widget.storage)),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final shipment = _shipment;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Factory Queue Driver'),
        actions: [
          IconButton(onPressed: _loading ? null : () => _refresh(), icon: const Icon(Icons.refresh_rounded)),
          IconButton(onPressed: _logout, icon: const Icon(Icons.logout_rounded)),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => _refresh(),
          child: ListView(
            padding: const EdgeInsets.all(18),
            children: [
              Text('Hoş geldiniz, $_fullName', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: 18),
              if (_loading && shipment == null)
                const Padding(
                  padding: EdgeInsets.only(top: 120),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (shipment == null)
                _EmptyState(onRefresh: () => _refresh())
              else ...[
                ShipmentStatusCard(shipment: shipment),
                const SizedBox(height: 18),
                if (shipment.status == ShipmentStatus.onTheWay)
                  PrimaryButton(label: 'Tesise Geldim', icon: Icons.flag_rounded, loading: _arriving, onPressed: _arrive),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onRefresh});

  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          children: [
            Icon(Icons.inventory_2_outlined, size: 58, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 18),
            Text('Aktif sevkiyatınız bulunmuyor.', style: Theme.of(context).textTheme.titleLarge, textAlign: TextAlign.center),
            const SizedBox(height: 18),
            OutlinedButton.icon(onPressed: onRefresh, icon: const Icon(Icons.refresh_rounded), label: const Text('Yenile')),
          ],
        ),
      ),
    );
  }
}
