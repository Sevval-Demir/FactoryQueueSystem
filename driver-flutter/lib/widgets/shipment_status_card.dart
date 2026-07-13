import 'package:flutter/material.dart';

import '../models/shipment.dart';

class ShipmentStatusCard extends StatelessWidget {
  const ShipmentStatusCard({super.key, required this.shipment});

  final Shipment shipment;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeStep = shipmentStepIndex(shipment.status);
    final statusColor = switch (shipment.status) {
      ShipmentStatus.completed => Colors.green,
      ShipmentStatus.waiting => Colors.orange,
      ShipmentStatus.onTheWay => Colors.blueGrey,
      ShipmentStatus.unknown => Colors.grey,
      _ => Colors.blue,
    };

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: theme.colorScheme.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(.12),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: statusColor.withOpacity(.28)),
                  ),
                  child: Icon(Icons.local_shipping_rounded, color: statusColor, size: 30),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(shipment.plateNumber, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 3),
                      Text(shipment.vehicleType, style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Chip(
                  backgroundColor: statusColor.withOpacity(.12),
                  side: BorderSide(color: statusColor.withOpacity(.32)),
                  label: Text(shipmentStatusText(shipment.status), style: TextStyle(color: statusColor, fontWeight: FontWeight.w800)),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(
              shipmentStatusDescription(shipment),
              style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(child: _MetricCard(label: 'Önünüzdeki Araç', value: shipment.vehiclesAheadCount.toString(), icon: Icons.alt_route_rounded)),
                const SizedBox(width: 12),
                Expanded(child: _MetricCard(label: 'Toplam Bekleyen', value: shipment.totalWaitingCount.toString(), icon: Icons.groups_rounded)),
              ],
            ),
            const SizedBox(height: 18),
            _InfoRow(label: 'Sıra No', value: shipment.queueNumber?.toString() ?? '—'),
            _InfoRow(label: 'Kabul Saati', value: _formatDate(shipment.arrivalTime)),
            _InfoRow(label: 'Sevkiyat No', value: shipment.id),
            if (shipment.status == ShipmentStatus.completed) ...[
              const SizedBox(height: 14),
              const Divider(),
              const SizedBox(height: 8),
              _InfoRow(label: 'Brüt Tartım', value: _formatWeight(shipment.grossWeight)),
              _InfoRow(label: 'Dara Tartım', value: _formatWeight(shipment.tareWeight)),
              _InfoRow(label: 'Net miktar', value: _formatWeight(shipment.netWeight)),
              _InfoRow(label: 'Tamamlanma', value: _formatDate(shipment.completedTime)),
            ],
            const SizedBox(height: 18),
            Text('Lojistik Akış', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w900)),
            const SizedBox(height: 12),
            _ProgressTimeline(activeStep: activeStep),
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

class _MetricCard extends StatelessWidget {
  const _MetricCard({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(.42),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(.16)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(height: 10),
          Text(label, style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(value, style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900)),
        ],
      ),
    );
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
            child: Text(label, style: TextStyle(color: Colors.blueGrey.shade600, fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value, overflow: TextOverflow.visible)),
        ],
      ),
    );
  }
}

class _ProgressTimeline extends StatefulWidget {
  const _ProgressTimeline({required this.activeStep});

  final int activeStep;

  @override
  State<_ProgressTimeline> createState() => _ProgressTimelineState();
}

class _ProgressTimelineState extends State<_ProgressTimeline> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _pulse;

  static const labels = ['Transit', 'Kabul', 'Sıra', 'Kantar', 'Boşaltım', 'Çıkış'];
  static const icons = [
    Icons.route_rounded,
    Icons.flag_rounded,
    Icons.format_list_numbered_rounded,
    Icons.scale_rounded,
    Icons.warehouse_rounded,
    Icons.check_circle_rounded,
  ];

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _pulse = Tween<double>(begin: .28, end: .72).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(labels.length, (index) {
        final done = index < widget.activeStep;
        final active = index == widget.activeStep;
        final future = index > widget.activeStep;
        final color = done ? Colors.green : active ? Colors.blue : Colors.blueGrey.shade200;

        return _TimelineRow(
          label: labels[index],
          icon: icons[index],
          color: color,
          done: done,
          active: active,
          future: future,
          isLast: index == labels.length - 1,
          pulse: _pulse,
        );
      }),
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.label,
    required this.icon,
    required this.color,
    required this.done,
    required this.active,
    required this.future,
    required this.isLast,
    required this.pulse,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool done;
  final bool active;
  final bool future;
  final bool isLast;
  final Animation<double> pulse;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 46,
            child: Column(
              children: [
                AnimatedBuilder(
                  animation: pulse,
                  builder: (context, child) {
                    return Container(
                      width: active ? 40 : 34,
                      height: active ? 40 : 34,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: color.withOpacity(active ? pulse.value : 1),
                        boxShadow: active ? [BoxShadow(color: color.withOpacity(pulse.value), blurRadius: 18, spreadRadius: 2)] : null,
                      ),
                      child: Center(
                        child: CircleAvatar(
                          radius: active ? 15 : 14,
                          backgroundColor: done || active ? color : Colors.blueGrey.shade100,
                          child: Icon(done ? Icons.check_rounded : icon, size: 18, color: done || active ? Colors.white : Colors.blueGrey.shade400),
                        ),
                      ),
                    );
                  },
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 3,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      decoration: BoxDecoration(
                        color: done ? Colors.green.withOpacity(.55) : Colors.blueGrey.shade200,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              margin: EdgeInsets.only(bottom: isLast ? 0 : 14),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: active ? Colors.blue.withOpacity(.08) : future ? Colors.blueGrey.withOpacity(.05) : Colors.green.withOpacity(.06),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: active ? Colors.blue.withOpacity(.26) : future ? Colors.blueGrey.withOpacity(.12) : Colors.green.withOpacity(.18)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      label,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: active ? FontWeight.w900 : FontWeight.w700,
                        color: future ? Colors.blueGrey.shade400 : active ? Colors.blue.shade700 : Colors.green.shade700,
                      ),
                    ),
                  ),
                  if (active)
                    Text('Aktif', style: theme.textTheme.labelLarge?.copyWith(color: Colors.blue.shade700, fontWeight: FontWeight.w900))
                  else if (done)
                    Text('Tamamlandı', style: theme.textTheme.labelLarge?.copyWith(color: Colors.green.shade700, fontWeight: FontWeight.w800)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
