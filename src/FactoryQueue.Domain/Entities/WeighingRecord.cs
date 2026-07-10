using FactoryQueue.Domain.Common;

namespace FactoryQueue.Domain.Entities;

public class WeighingRecord : BaseEntity
{
    public Guid ShipmentId { get; set; }

    public Shipment Shipment { get; set; } = null!;

    public decimal? GrossWeight { get; set; }

    public decimal? TareWeight { get; set; }

    public decimal? NetWeight { get; set; }

    public DateTime? GrossTime { get; set; }

    public DateTime? TareTime { get; set; }

    public DateTime? UnloadStart { get; set; }

    public DateTime? UnloadEnd { get; set; }
}