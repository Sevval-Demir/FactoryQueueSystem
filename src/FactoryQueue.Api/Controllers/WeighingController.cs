using FactoryQueue.Application.DTOs.Weighing;
using FactoryQueue.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryQueue.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class WeighingController : ControllerBase
{
    private readonly IWeighingService _weighingService;

    public WeighingController(IWeighingService weighingService)
    {
        _weighingService = weighingService;
    }

    [HttpPost("{shipmentId}/gross")]
    public async Task<IActionResult> Gross(Guid shipmentId, GrossWeightRequest request)
    {
        return await ExecuteAsync(
            () => _weighingService.SaveGrossWeightAsync(shipmentId, request),
            "Brüt ağırlık kaydedildi.");
    }

    [HttpPost("{shipmentId}/start-unload")]
    public async Task<IActionResult> StartUnload(Guid shipmentId)
    {
        return await ExecuteAsync(
            () => _weighingService.StartUnloadAsync(shipmentId),
            "Boşaltma başladı.");
    }

    [HttpPost("{shipmentId}/finish-unload")]
    public async Task<IActionResult> FinishUnload(Guid shipmentId)
    {
        return await ExecuteAsync(
            () => _weighingService.FinishUnloadAsync(shipmentId),
            "Boşaltma tamamlandı.");
    }

    [HttpPost("{shipmentId}/tare")]
    public async Task<IActionResult> Tare(Guid shipmentId, TareWeightRequest request)
    {
        return await ExecuteAsync(
            () => _weighingService.SaveTareWeightAsync(shipmentId, request),
            "Dara kaydedildi.");
    }

    private static async Task<IActionResult> ExecuteAsync(Func<Task> action, string successMessage)
    {
        try
        {
            await action();
            return new OkObjectResult(successMessage);
        }
        catch (Exception ex)
        {
            return new BadRequestObjectResult(ex.Message);
        }
    }
}
