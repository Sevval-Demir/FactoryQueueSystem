using FactoryQueue.Application.DTOs.Admin;
using FactoryQueue.Application.DTOs.Shipment;
using FactoryQueue.Application.Exceptions;
using FactoryQueue.Application.Interfaces;
using FactoryQueue.Domain.Entities;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Services;

public class ShipmentService : IShipmentService
{
    private readonly FactoryQueueDbContext _context;
    public ShipmentService(FactoryQueueDbContext context) => _context = context;

    public async Task<ActiveShipmentResponse?> GetActiveShipmentAsync(Guid driverId)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Vehicle)
            .FirstOrDefaultAsync(s => s.Vehicle.DriverId == driverId && s.Status != ShipmentStatus.Completed);

        return shipment is null
            ? null
            : new ActiveShipmentResponse
            {
                Id = shipment.Id,
                PlateNumber = shipment.Vehicle.PlateNumber,
                VehicleType = shipment.Vehicle.VehicleType,
                Status = shipment.Status.ToString(),
                ArrivalTime = shipment.ArrivalTime
            };
    }

    public async Task ArriveAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments.FirstOrDefaultAsync(x => x.Id == shipmentId) ?? throw new NotFoundException("Sevkiyat bulunamadı.");
        if (shipment.Status != ShipmentStatus.OnTheWay) throw new BusinessException("Yalnızca yoldaki sevkiyatlar sıraya alınabilir.");
        var lastQueueNumber = await _context.QueueEntries.OrderByDescending(q => q.QueueNumber).Select(q => q.QueueNumber).FirstOrDefaultAsync();
        shipment.Status = ShipmentStatus.Waiting;
        shipment.ArrivalTime = DateTime.UtcNow;
        _context.QueueEntries.Add(new QueueEntry { ShipmentId = shipment.Id, QueueNumber = lastQueueNumber + 1, ArrivedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();
    }

    public async Task<ShipmentStatusResponse?> GetStatusAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments
            .Include(x => x.QueueEntry)
            .Include(x => x.WeighingRecord)
            .FirstOrDefaultAsync(x => x.Id == shipmentId);

        return shipment is null
            ? null
            : new ShipmentStatusResponse
            {
                ShipmentId = shipment.Id,
                Status = shipment.Status.ToString(),
                QueueNumber = shipment.QueueEntry?.QueueNumber,
                GrossWeight = shipment.WeighingRecord?.GrossWeight,
                TareWeight = shipment.WeighingRecord?.TareWeight,
                NetWeight = shipment.WeighingRecord?.NetWeight,
                CompletedTime = shipment.CompletedTime
            };
    }

    public async Task<List<AdminShipmentDto>> GetAdminShipmentsAsync()
    {
        var shipments = await AdminQuery().OrderByDescending(x => x.CompletedTime ?? x.ArrivalTime).ToListAsync();
        return shipments.Select(ToAdminDto).ToList();
    }

    public async Task<AdminShipmentDto?> GetAdminShipmentAsync(Guid shipmentId)
    {
        var shipment = await AdminQuery().FirstOrDefaultAsync(x => x.Id == shipmentId);
        return shipment is null ? null : ToAdminDto(shipment);
    }

    private IQueryable<Shipment> AdminQuery() => _context.Shipments.AsNoTracking().Include(x => x.Vehicle).ThenInclude(x => x.Driver).Include(x => x.QueueEntry).Include(x => x.WeighingRecord);

    private static AdminShipmentDto ToAdminDto(Shipment shipment)
    {
        var record = shipment.WeighingRecord;
        return new AdminShipmentDto { ShipmentId = shipment.Id, QueueEntryId = shipment.QueueEntry?.Id, QueueNumber = shipment.QueueEntry?.QueueNumber, Status = shipment.Status.ToString(), StatusName = StatusName(shipment.Status), PlateNumber = shipment.Vehicle.PlateNumber, VehicleType = shipment.Vehicle.VehicleType, DriverId = shipment.Vehicle.DriverId, DriverName = shipment.Vehicle.Driver.FullName, DriverPhone = shipment.Vehicle.Driver.Phone, ArrivalTime = shipment.ArrivalTime, CalledAt = shipment.QueueEntry?.CalledAt, GrossWeight = record?.GrossWeight, GrossTime = record?.GrossTime, UnloadStart = record?.UnloadStart, UnloadEnd = record?.UnloadEnd, TareWeight = record?.TareWeight, TareTime = record?.TareTime, NetWeight = record?.NetWeight, CompletedTime = shipment.CompletedTime };
    }

    private static string StatusName(ShipmentStatus status) => status switch { ShipmentStatus.OnTheWay => "Yolda", ShipmentStatus.Waiting => "Bekliyor", ShipmentStatus.Called => "Çağrıldı", ShipmentStatus.OnScale => "Kantarda", ShipmentStatus.Unloading => "Boşaltılıyor", ShipmentStatus.UnloadCompleted => "Boşaltma Tamamlandı", ShipmentStatus.Completed => "Tamamlandı", _ => "Bilinmiyor" };
}
