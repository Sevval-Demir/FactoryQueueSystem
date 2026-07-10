using FactoryQueue.Domain.Common;

namespace FactoryQueue.Domain.Entities;

public class Vehicle : BaseEntity
{
    public string PlateNumber { get; set; } = string.Empty;

    public string VehicleType { get; set; } = string.Empty;

    public Guid DriverId { get; set; }

    public User Driver { get; set; } = null!;
    public ICollection<Shipment> Shipments { get; set; } = new List<Shipment>();
}