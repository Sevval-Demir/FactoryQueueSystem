enum ShipmentStatus {
  onTheWay,
  waiting,
  called,
  onScale,
  unloading,
  unloadCompleted,
  completed,
  unknown,
}

class Shipment {
  const Shipment({
    required this.id,
    required this.plateNumber,
    required this.vehicleType,
    required this.status,
    this.queueNumber,
    this.arrivalTime,
    this.grossWeight,
    this.tareWeight,
    this.netWeight,
    this.completedTime,
  });

  final String id;
  final String plateNumber;
  final String vehicleType;
  final ShipmentStatus status;
  final int? queueNumber;
  final DateTime? arrivalTime;
  final double? grossWeight;
  final double? tareWeight;
  final double? netWeight;
  final DateTime? completedTime;

  factory Shipment.fromActiveJson(Map<String, dynamic> json) {
    return Shipment(
      id: (json['id'] ?? json['shipmentId'] ?? '').toString(),
      plateNumber: (json['plateNumber'] ?? '').toString(),
      vehicleType: (json['vehicleType'] ?? '—').toString(),
      status: parseShipmentStatus(json['status']),
      arrivalTime: _parseDate(json['arrivalTime']),
    );
  }

  Shipment copyWithStatus(Map<String, dynamic> json) {
    return Shipment(
      id: (json['shipmentId'] ?? id).toString(),
      plateNumber: plateNumber,
      vehicleType: vehicleType,
      status: parseShipmentStatus(json['status']),
      queueNumber: _parseInt(json['queueNumber']),
      arrivalTime: arrivalTime,
      grossWeight: _parseDouble(json['grossWeight']),
      tareWeight: _parseDouble(json['tareWeight']),
      netWeight: _parseDouble(json['netWeight']),
      completedTime: _parseDate(json['completedTime']),
    );
  }
}

ShipmentStatus parseShipmentStatus(Object? value) {
  if (value is int) {
    return switch (value) {
      1 => ShipmentStatus.onTheWay,
      2 => ShipmentStatus.waiting,
      3 => ShipmentStatus.called,
      4 => ShipmentStatus.onScale,
      5 => ShipmentStatus.unloading,
      6 => ShipmentStatus.unloadCompleted,
      7 => ShipmentStatus.completed,
      _ => ShipmentStatus.unknown,
    };
  }

  final status = value?.toString().toLowerCase();
  return switch (status) {
    'ontheway' => ShipmentStatus.onTheWay,
    'waiting' => ShipmentStatus.waiting,
    'called' => ShipmentStatus.called,
    'onscale' => ShipmentStatus.onScale,
    'unloading' => ShipmentStatus.unloading,
    'unloadcompleted' => ShipmentStatus.unloadCompleted,
    'completed' => ShipmentStatus.completed,
    _ => ShipmentStatus.unknown,
  };
}

String shipmentStatusText(ShipmentStatus status) {
  return switch (status) {
    ShipmentStatus.onTheWay => 'Yolda',
    ShipmentStatus.waiting => 'Sırada Bekliyor',
    ShipmentStatus.called => 'Kantara Çağrıldı',
    ShipmentStatus.onScale => 'Kantarda',
    ShipmentStatus.unloading => 'Boşaltılıyor',
    ShipmentStatus.unloadCompleted => 'Boşaltma Tamamlandı',
    ShipmentStatus.completed => 'Tamamlandı',
    ShipmentStatus.unknown => 'Bilinmiyor',
  };
}

String shipmentStatusDescription(Shipment shipment) {
  return switch (shipment.status) {
    ShipmentStatus.onTheWay => 'Tesise ulaştığınızda varışınızı bildirin.',
    ShipmentStatus.waiting => 'Sıradasınız. Sıra numaranız: ${shipment.queueNumber ?? '—'}',
    ShipmentStatus.called => 'Kantara çağrıldınız. Lütfen kantar alanına ilerleyin.',
    ShipmentStatus.onScale => 'Tartım işleminiz devam ediyor.',
    ShipmentStatus.unloading => 'Boşaltma işleminiz devam ediyor.',
    ShipmentStatus.unloadCompleted => 'Boşaltma tamamlandı. Dara tartımı bekleniyor.',
    ShipmentStatus.completed => 'Sevkiyatınız tamamlandı.',
    ShipmentStatus.unknown => 'Sevkiyat durumu alınamadı.',
  };
}

int shipmentStepIndex(ShipmentStatus status) {
  return switch (status) {
    ShipmentStatus.onTheWay => 0,
    ShipmentStatus.waiting => 2,
    ShipmentStatus.called => 3,
    ShipmentStatus.onScale => 3,
    ShipmentStatus.unloading => 4,
    ShipmentStatus.unloadCompleted => 4,
    ShipmentStatus.completed => 5,
    ShipmentStatus.unknown => 0,
  };
}

DateTime? _parseDate(Object? value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}

int? _parseInt(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}

double? _parseDouble(Object? value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse(value.toString());
}
