namespace FactoryQueue.Application.DTOs.Admin;

public class AdminShipmentDto
{
    public Guid ShipmentId { get; set; }
    public Guid? QueueEntryId { get; set; }
    public int? QueueNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StatusName { get; set; } = string.Empty;
    public string PlateNumber { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public Guid DriverId { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string DriverPhone { get; set; } = string.Empty;
    public DateTime? ArrivalTime { get; set; }
    public DateTime? CalledAt { get; set; }
    public decimal? GrossWeight { get; set; }
    public DateTime? GrossTime { get; set; }
    public DateTime? UnloadStart { get; set; }
    public DateTime? UnloadEnd { get; set; }
    public decimal? TareWeight { get; set; }
    public DateTime? TareTime { get; set; }
    public decimal? NetWeight { get; set; }
    public DateTime? CompletedTime { get; set; }
}
