using FactoryQueue.Domain.Common;

namespace FactoryQueue.Domain.Entities;

public class QueueEntry : BaseEntity
{
    public Guid ShipmentId { get; set; }

    public Shipment Shipment { get; set; } = null!;

    public int QueueNumber { get; set; }

    public DateTime ArrivedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CalledAt { get; set; }
}