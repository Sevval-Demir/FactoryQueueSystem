import 'package:flutter/material.dart';

import '../models/shipment.dart';

class ShipmentStatusCard extends StatelessWidget {
  const ShipmentStatusCard({super.key, required this.shipment});

  final Shipment shipment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeStep = shipmentStepIndex(shipment.status);

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    shipment.plateNumber,
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                  ),
                ),
                Chip(label: Text(shipmentStatusText(shipment.status))),
              ],
            ),
            const SizedBox(height: 14),
            _InfoRow(label: 'Araç tipi', value: shipment.vehicleType),
            _InfoRow(label: 'Shipment ID', value: shipment.id),
            _InfoRow(label: 'Sıra numarası', value: shipment.queueNumber?.toString() ?? '—'),
            _InfoRow(label: 'Geliş zamanı', value: _formatDate(shipment.arrivalTime)),
            const SizedBox(height: 14),
            Text(
              shipmentStatusDescription(shipment),
              style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700),
            ),
            if (shipment.status == ShipmentStatus.completed) ...[
              const SizedBox(height: 14),
              const Divider(),
              const SizedBox(height: 8),
              _InfoRow(label: 'Brüt ağırlık', value: _formatWeight(shipment.grossWeight)),
              _InfoRow(label: 'Dara ağırlığı', value: _formatWeight(shipment.tareWeight)),
              _InfoRow(label: 'Net miktar', value: _formatWeight(shipment.netWeight)),
              _InfoRow(label: 'Tamamlanma', value: _formatDate(shipment.completedTime)),
            ],
            const SizedBox(height: 18),
            _ProgressSteps(activeStep: activeStep),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime? value) {
    if (value == null) return '—';
    final local = value.toLocal();
    return '${local.day.toString().padLeft(2, '0')}.${local.month.toString().padLeft(2, '0')}.${local.year} ${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
  }

  String _formatWeight(double? value) {
    if (value == null) return '—';
    return '${value.toStringAsFixed(0)} kg';
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 112,
            child: Text(label, style: TextStyle(color: Colors.blueGrey.shade600)),
          ),
          Expanded(child: Text(value, overflow: TextOverflow.visible)),
        ],
      ),
    );
  }
}

class _ProgressSteps extends StatelessWidget {
  const _ProgressSteps({required this.activeStep});

  final int activeStep;

  static const labels = ['Yolda', 'Tesise Geldi', 'Sırada', 'Kantarda', 'Boşaltma', 'Tamamlandı'];

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      children: List.generate(labels.length, (index) {
        final done = index < activeStep;
        final active = index == activeStep;
        final color = done || active ? colorScheme.primary : Colors.blueGrey.shade200;

        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: [
              CircleAvatar(
                radius: 15,
                backgroundColor: color,
                child: Icon(done ? Icons.check_rounded : Icons.circle, size: done ? 18 : 9, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  labels[index],
                  style: TextStyle(fontWeight: active ? FontWeight.w800 : FontWeight.w500, color: active ? colorScheme.primary : null),
                ),
              ),
            ],
          ),
        );
      }),
    );
  }
}
