namespace FactoryQueue.Application.DTOs.Shipment;

public class ActiveShipmentResponse
{
    public Guid Id { get; set; }

    public string PlateNumber { get; set; } = string.Empty;

    public string VehicleType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public DateTime? ArrivalTime { get; set; }
}
