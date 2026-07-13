using System.Data;
using FactoryQueue.Application.DTOs.Weighing;
using FactoryQueue.Application.Exceptions;
using FactoryQueue.Application.Interfaces;
using FactoryQueue.Domain.Entities;
using FactoryQueue.Domain.Enums;
using FactoryQueue.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FactoryQueue.Infrastructure.Services;

public class WeighingService : IWeighingService
{
    private static readonly ShipmentStatus[] ActiveOperationStatuses =
    [
        ShipmentStatus.Called,
        ShipmentStatus.OnScale,
        ShipmentStatus.Unloading,
        ShipmentStatus.UnloadCompleted
    ];

    private readonly FactoryQueueDbContext _context;
    private readonly IQueueNotificationService _notifications;

    public WeighingService(FactoryQueueDbContext context, IQueueNotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task SaveGrossWeightAsync(Guid shipmentId, GrossWeightRequest request)
    {
        if (request.GrossWeight <= 0)
            throw new BusinessException("Brüt ağırlık sıfırdan büyük olmalıdır.");

        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var shipment = await LoadShipmentAsync(shipmentId);
        await EnsureQueueOrderAsync(shipment);

        if (shipment.Status != ShipmentStatus.Called)
            throw new BusinessException("Brüt tartım yalnızca çağrılmış araç için yapılabilir.");

        var record = await GetOrCreateRecordAsync(shipmentId);
        record.GrossWeight = request.GrossWeight;
        record.GrossTime = DateTime.UtcNow;

        if (request.HasLoad == false)
        {
            shipment.Status = ShipmentStatus.UnloadCompleted;
        }
        else
        {
            shipment.Status = ShipmentStatus.OnScale;
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.ShipmentUpdatedAsync(shipmentId);
    }

    public async Task StartUnloadAsync(Guid shipmentId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var shipment = await LoadShipmentAsync(shipmentId);
        await EnsureQueueOrderAsync(shipment);

        if (shipment.Status != ShipmentStatus.OnScale)
            throw new BusinessException("Boşaltma yalnızca brüt tartımı yapılmış araç için başlatılabilir.");

        var record = await GetRequiredRecordAsync(shipmentId);
        if (record.GrossWeight == null)
            throw new NotFoundException("Brüt tartım kaydı bulunamadı.");

        record.UnloadStart = DateTime.UtcNow;
        shipment.Status = ShipmentStatus.Unloading;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.ShipmentUpdatedAsync(shipmentId);
    }

    public async Task FinishUnloadAsync(Guid shipmentId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var shipment = await LoadShipmentAsync(shipmentId);
        await EnsureQueueOrderAsync(shipment);

        if (shipment.Status != ShipmentStatus.Unloading)
            throw new BusinessException("Boşaltma bitirme işlemi yalnızca boşaltmada olan araç için yapılabilir.");

        var record = await GetRequiredRecordAsync(shipmentId);

        if (record.UnloadStart == null)
            throw new NotFoundException("Boşaltma başlangıç kaydı bulunamadı.");

        record.UnloadEnd = DateTime.UtcNow;
        shipment.Status = ShipmentStatus.UnloadCompleted;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.ShipmentUpdatedAsync(shipmentId);
    }

    public async Task SaveTareWeightAsync(Guid shipmentId, TareWeightRequest request)
    {
        if (request.TareWeight <= 0)
            throw new BusinessException("Dara ağırlığı sıfırdan büyük olmalıdır.");

        await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

        var shipment = await LoadShipmentAsync(shipmentId);
        await EnsureQueueOrderAsync(shipment);

        if (shipment.Status != ShipmentStatus.UnloadCompleted)
            throw new BusinessException("Dara tartımı yalnızca boşaltması tamamlanan araç için yapılabilir.");

        var record = await GetRequiredRecordAsync(shipmentId);

        if (record.GrossWeight == null)
            throw new NotFoundException("Brüt tartım kaydı bulunamadı.");

        if (request.TareWeight > record.GrossWeight)
            throw new BusinessException("Dara ağırlığı brüt ağırlığı geçemez.");

        record.TareWeight = request.TareWeight;
        record.TareTime = DateTime.UtcNow;
        record.NetWeight = record.GrossWeight - record.TareWeight;
        shipment.Status = ShipmentStatus.Completed;
        shipment.CompletedTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();
        await _notifications.ShipmentUpdatedAsync(shipmentId);
    }

    private async Task<Shipment> LoadShipmentAsync(Guid shipmentId)
    {
        return await _context.Shipments
            .Include(s => s.QueueEntry)
            .FirstOrDefaultAsync(s => s.Id == shipmentId)
            ?? throw new NotFoundException("Sevkiyat bulunamadı.");
    }

    private async Task EnsureQueueOrderAsync(Shipment shipment)
    {
        var queueNumber = shipment.QueueEntry?.QueueNumber
            ?? throw new BusinessException("Başka bir araç için kantar işlemi devam ediyor.");

        var blocked = await _context.Shipments
            .AsNoTracking()
            .Where(s => s.Id != shipment.Id && s.QueueEntry != null)
            .AnyAsync(s =>
                s.QueueEntry!.QueueNumber < queueNumber &&
                s.Status != ShipmentStatus.Completed);

        if (blocked)
            throw new BusinessException("Başka bir araç için kantar işlemi devam ediyor.");

        var anotherActive = await _context.Shipments
            .AsNoTracking()
            .AnyAsync(s => s.Id != shipment.Id && ActiveOperationStatuses.Contains(s.Status));

        if (anotherActive)
            throw new BusinessException("Başka bir araç için kantar işlemi devam ediyor.");
    }

    private async Task<WeighingRecord> GetOrCreateRecordAsync(Guid shipmentId)
    {
        var record = await _context.WeighingRecords.FirstOrDefaultAsync(x => x.ShipmentId == shipmentId);
        if (record != null)
        {
            return record;
        }

        record = new WeighingRecord { ShipmentId = shipmentId };
        _context.WeighingRecords.Add(record);
        return record;
    }

    private async Task<WeighingRecord> GetRequiredRecordAsync(Guid shipmentId)
    {
        return await _context.WeighingRecords.FirstOrDefaultAsync(x => x.ShipmentId == shipmentId)
            ?? throw new NotFoundException("Tartım kaydı bulunamadı.");
    }
}
