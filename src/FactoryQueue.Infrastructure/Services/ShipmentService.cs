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
    private readonly IQueueNotificationService _notifications;

    public ShipmentService(FactoryQueueDbContext context, IQueueNotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<ActiveShipmentResponse?> GetActiveShipmentAsync(Guid driverId)
    {
        var shipment = await _context.Shipments
            .Include(s => s.Vehicle)
            .OrderByDescending(s => s.CreatedAt)
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

    public async Task EnsureNextShipmentForDriverAsync(Guid driverId)
    {
        var hasActiveShipment = await _context.Shipments.AnyAsync(s => s.Vehicle.DriverId == driverId && s.Status != ShipmentStatus.Completed);
        if (hasActiveShipment)
        {
            return;
        }

        var lastCompletedShipment = await _context.Shipments
            .Include(s => s.Vehicle)
            .OrderByDescending(s => s.CompletedTime ?? s.CreatedAt)
            .FirstOrDefaultAsync(s => s.Vehicle.DriverId == driverId && s.Status == ShipmentStatus.Completed);

        if (lastCompletedShipment is null)
        {
            return;
        }

        _context.Shipments.Add(new Shipment
        {
            VehicleId = lastCompletedShipment.VehicleId,
            Status = ShipmentStatus.OnTheWay
        });

        await _context.SaveChangesAsync();
    }

    public async Task ArriveAsync(Guid shipmentId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable);

        var shipment = await _context.Shipments.FirstOrDefaultAsync(x => x.Id == shipmentId) ?? throw new NotFoundException("Sevkiyat bulunamadı.");
        if (shipment.Status != ShipmentStatus.OnTheWay) throw new BusinessException("Yalnızca yoldaki sevkiyatlar sıraya alınabilir.");

        var today = DateTime.Today;
        var tomorrow = today.AddDays(1);
        var todayShipmentCount = await _context.Shipments.CountAsync(s =>
            s.ArrivalTime.HasValue &&
            s.ArrivalTime.Value >= today &&
            s.ArrivalTime.Value < tomorrow);

        var now = DateTime.Now;
        shipment.Status = ShipmentStatus.Waiting;
        shipment.ArrivalTime = now;
        _context.QueueEntries.Add(new QueueEntry { ShipmentId = shipment.Id, QueueNumber = todayShipmentCount + 1, ArrivedAt = now });

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.QueueUpdatedAsync();
    }

    public async Task<ShipmentStatusResponse?> GetStatusAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments
            .Include(x => x.QueueEntry)
            .Include(x => x.WeighingRecord)
            .FirstOrDefaultAsync(x => x.Id == shipmentId);

        if (shipment is null) return null;

        var totalWaitingCount = await _context.Shipments.CountAsync(x => x.Status == ShipmentStatus.Waiting);
        var vehiclesAheadCount = shipment.QueueEntry?.QueueNumber is int queueNumber
            ? await _context.Shipments.CountAsync(x =>
                x.Status == ShipmentStatus.Waiting &&
                x.QueueEntry != null &&
                x.QueueEntry.QueueNumber < queueNumber)
            : 0;

        return new ShipmentStatusResponse
        {
            ShipmentId = shipment.Id,
            Status = shipment.Status.ToString(),
            QueueNumber = shipment.QueueEntry?.QueueNumber,
            TotalWaitingCount = totalWaitingCount,
            VehiclesAheadCount = vehiclesAheadCount,
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
