using FactoryQueue.Application.DTOs.Admin;
using FactoryQueue.Application.DTOs.Shipment;

namespace FactoryQueue.Application.Interfaces;

public interface IShipmentService
{
    Task<ActiveShipmentResponse?> GetActiveShipmentAsync(Guid driverId);
    Task EnsureNextShipmentForDriverAsync(Guid driverId);
    Task ArriveAsync(Guid shipmentId);
    Task<ShipmentStatusResponse?> GetStatusAsync(Guid shipmentId);
    Task<List<AdminShipmentDto>> GetAdminShipmentsAsync();
    Task<AdminShipmentDto?> GetAdminShipmentAsync(Guid shipmentId);
}
