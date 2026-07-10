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
    private readonly FactoryQueueDbContext _context;

    public WeighingService(FactoryQueueDbContext context)
    {
        _context = context;
    }

    public async Task SaveGrossWeightAsync(Guid shipmentId, GrossWeightRequest request)
    {
        if (request.GrossWeight <= 0)
            throw new BusinessException("Brüt ağırlık pozitif olmalıdır.");

        var shipment = await _context.Shipments.FindAsync(shipmentId)
            ?? throw new NotFoundException("Sevkiyat bulunamadı.");

        if (shipment.Status != ShipmentStatus.Called)
            throw new BusinessException("Brüt tartım yalnızca çağrılmış araç için yapılabilir.");

        var record = await _context.WeighingRecords
            .FirstOrDefaultAsync(x => x.ShipmentId == shipmentId);

        if (record == null)
        {
            record = new WeighingRecord { ShipmentId = shipmentId };
            _context.WeighingRecords.Add(record);
        }

        record.GrossWeight = request.GrossWeight;
        record.GrossTime = DateTime.UtcNow;
        shipment.Status = ShipmentStatus.OnScale;

        await _context.SaveChangesAsync();
    }

    public async Task StartUnloadAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments.FindAsync(shipmentId)
            ?? throw new NotFoundException("Sevkiyat bulunamadı.");

        if (shipment.Status != ShipmentStatus.OnScale)
            throw new BusinessException("Boşaltma yalnızca brüt tartımı yapılmış araç için başlatılabilir.");

        var record = await _context.WeighingRecords
            .FirstOrDefaultAsync(x => x.ShipmentId == shipmentId);

        if (record?.GrossWeight == null)
            throw new NotFoundException("Brüt tartım kaydı bulunamadı.");

        record.UnloadStart = DateTime.UtcNow;
        shipment.Status = ShipmentStatus.Unloading;

        await _context.SaveChangesAsync();
    }

    public async Task FinishUnloadAsync(Guid shipmentId)
    {
        var shipment = await _context.Shipments.FindAsync(shipmentId)
            ?? throw new NotFoundException("Sevkiyat bulunamadı.");

        if (shipment.Status != ShipmentStatus.Unloading)
            throw new BusinessException("Boşaltma bitirme işlemi yalnızca boşaltmada olan araç için yapılabilir.");

        var record = await _context.WeighingRecords
            .FirstOrDefaultAsync(x => x.ShipmentId == shipmentId);

        if (record?.UnloadStart == null)
            throw new NotFoundException("Boşaltma başlangıç kaydı bulunamadı.");

        record.UnloadEnd = DateTime.UtcNow;
        shipment.Status = ShipmentStatus.UnloadCompleted;

        await _context.SaveChangesAsync();
    }

    public async Task SaveTareWeightAsync(Guid shipmentId, TareWeightRequest request)
    {
        if (request.TareWeight <= 0)
            throw new BusinessException("Dara ağırlığı pozitif olmalıdır.");

        var shipment = await _context.Shipments.FindAsync(shipmentId)
            ?? throw new NotFoundException("Sevkiyat bulunamadı.");

        if (shipment.Status != ShipmentStatus.UnloadCompleted)
            throw new BusinessException("Dara tartımı yalnızca boşaltması tamamlanan araç için yapılabilir.");

        var record = await _context.WeighingRecords
            .FirstOrDefaultAsync(x => x.ShipmentId == shipmentId);

        if (record?.GrossWeight == null)
            throw new NotFoundException("Brüt tartım kaydı bulunamadı.");

        if (request.TareWeight >= record.GrossWeight)
            throw new BusinessException("Dara ağırlığı brüt ağırlıktan küçük olmalıdır.");

        record.TareWeight = request.TareWeight;
        record.TareTime = DateTime.UtcNow;
        record.NetWeight = record.GrossWeight - record.TareWeight;
        shipment.Status = ShipmentStatus.Completed;
        shipment.CompletedTime = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }
}
