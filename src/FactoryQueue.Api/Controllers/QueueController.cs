using FactoryQueue.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryQueue.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class QueueController : ControllerBase
{
    private readonly IQueueService _queueService;

    public QueueController(IQueueService queueService)
    {
        _queueService = queueService;
    }

    [HttpGet("waiting")]
    public async Task<IActionResult> Waiting()
    {
        return Ok(await _queueService.GetWaitingQueueAsync());
    }

    [HttpPost("{queueEntryId}/call")]
    public async Task<IActionResult> Call(Guid queueEntryId)
    {
        try
        {
            await _queueService.CallVehicleAsync(queueEntryId);
            return Ok("Araç çağrıldı.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
