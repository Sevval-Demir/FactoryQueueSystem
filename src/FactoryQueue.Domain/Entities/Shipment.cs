using FactoryQueue.Domain.Common;
using FactoryQueue.Domain.Enums;

namespace FactoryQueue.Domain.Entities;

public class Shipment : BaseEntity
{
    public Guid VehicleId { get; set; }

    public Vehicle Vehicle { get; set; } = null!;

    public ShipmentStatus Status { get; set; } = ShipmentStatus.OnTheWay;

    public DateTime? ArrivalTime { get; set; }

    public DateTime? CompletedTime { get; set; }
    public QueueEntry? QueueEntry { get; set; }

    public WeighingRecord? WeighingRecord { get; set; }
}