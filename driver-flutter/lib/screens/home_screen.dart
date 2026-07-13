import 'dart:async';

import 'package:flutter/material.dart';

import '../core/api/dio_client.dart';
import '../core/storage/secure_storage_service.dart';
import '../models/shipment.dart';
import '../services/api_error.dart';
import '../services/auth_service.dart';
import '../services/queue_signalr_service.dart';
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
  late final QueueSignalRService _queueSignalRService;
  Shipment? _shipment;
  final _plateController = TextEditingController();
  final _vehicleTypeController = TextEditingController();
  String _fullName = '';
  String? _driverId;
  bool _loading = true;
  bool _arriving = false;
  bool _savingVehicle = false;

  @override
  void initState() {
    super.initState();
    final client = DioClient(widget.storage);
    _shipmentService = ShipmentService(client);
    _authService = AuthService(client, widget.storage);
    _queueSignalRService = QueueSignalRService(widget.storage);
    _loadInitial();
  }

  Future<void> _loadInitial() async {
    _fullName = await widget.storage.readFullName() ?? 'Sürücü';
    _driverId = await widget.storage.readUserId();
    await _refresh(showMessage: false);
    if (!mounted || _driverId == null || _driverId!.isEmpty) return;
    await _queueSignalRService.connect(
      currentShipmentId: () => _shipment?.id,
      onQueueUpdated: () => _refresh(showMessage: false),
      onCurrentShipmentUpdated: () => _refresh(showMessage: false),
    );
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
    await _queueSignalRService.dispose();
    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => LoginScreen(storage: widget.storage)),
      (_) => false,
    );
  }

  @override
  void dispose() {
    _plateController.dispose();
    _vehicleTypeController.dispose();
    unawaited(_queueSignalRService.dispose());
    super.dispose();
  }

  Future<void> _saveVehicleInfo() async {
    final plateNumber = _plateController.text.trim();
    final vehicleType = _vehicleTypeController.text.trim();
    if (plateNumber.isEmpty || vehicleType.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plaka ve araç tipi zorunludur.')));
      return;
    }

    setState(() => _savingVehicle = true);
    try {
      await _authService.saveVehicleInfo(plateNumber: plateNumber, vehicleType: vehicleType);
      await _refresh(showMessage: false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Araç bilgileriniz kaydedildi.')));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(apiErrorMessage(error))));
      }
    } finally {
      if (mounted) setState(() => _savingVehicle = false);
    }
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
                _VehicleInfoForm(
                  plateController: _plateController,
                  vehicleTypeController: _vehicleTypeController,
                  loading: _savingVehicle,
                  onSave: _saveVehicleInfo,
                )
              else ...[
                ShipmentStatusCard(shipment: shipment),
                const SizedBox(height: 18),
                if (shipment.status == ShipmentStatus.onTheWay)
                  PrimaryButton(label: 'Kabul Kaydımı Başlat', icon: Icons.flag_rounded, loading: _arriving, onPressed: _arrive),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _VehicleInfoForm extends StatelessWidget {
  const _VehicleInfoForm({
    required this.plateController,
    required this.vehicleTypeController,
    required this.loading,
    required this.onSave,
  });

  final TextEditingController plateController;
  final TextEditingController vehicleTypeController;
  final bool loading;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Icon(Icons.inventory_2_outlined, size: 58, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 18),
            Text('Araç bilgilerinizi tanımlayın', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text('Sıraya girebilmek için plaka ve araç tipi bilgisi gereklidir.', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
            const SizedBox(height: 18),
            TextField(
              controller: plateController,
              textCapitalization: TextCapitalization.characters,
              decoration: const InputDecoration(labelText: 'Plaka', prefixIcon: Icon(Icons.pin_rounded)),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: vehicleTypeController,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => onSave(),
              decoration: const InputDecoration(labelText: 'Araç Tipi', prefixIcon: Icon(Icons.local_shipping_rounded)),
            ),
            const SizedBox(height: 18),
            PrimaryButton(label: 'Araç Bilgilerini Kaydet', loading: loading, icon: Icons.save_rounded, onPressed: onSave),
          ],
        ),
      ),
    );
  }
}
