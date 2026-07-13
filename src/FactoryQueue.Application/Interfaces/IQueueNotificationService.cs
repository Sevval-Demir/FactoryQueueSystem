namespace FactoryQueue.Application.Interfaces;

public interface IQueueNotificationService
{
    Task QueueUpdatedAsync();

    Task ShipmentUpdatedAsync(Guid shipmentId);
}
