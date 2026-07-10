using FactoryQueue.Application.DTOs.Weighing;

namespace FactoryQueue.Application.Interfaces;

public interface IWeighingService
{
    Task SaveGrossWeightAsync(Guid shipmentId, GrossWeightRequest request);

    Task StartUnloadAsync(Guid shipmentId);

    Task FinishUnloadAsync(Guid shipmentId);

    Task SaveTareWeightAsync(Guid shipmentId, TareWeightRequest request);
}