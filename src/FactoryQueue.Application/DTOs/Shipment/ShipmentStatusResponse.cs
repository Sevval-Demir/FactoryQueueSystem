namespace FactoryQueue.Application.DTOs.Shipment;

public class ShipmentStatusResponse
{
    public Guid ShipmentId { get; set; }

    public string Status { get; set; } = string.Empty;

    public int? QueueNumber { get; set; }

    public decimal? GrossWeight { get; set; }

    public decimal? TareWeight { get; set; }

    public decimal? NetWeight { get; set; }

    public DateTime? CompletedTime { get; set; }
}
