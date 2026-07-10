using FactoryQueue.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using FactoryQueue.Application.DTOs.Shipment;

namespace FactoryQueue.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    [HttpGet("active/{driverId}")]
    public async Task<IActionResult> GetActiveShipment(Guid driverId)
    {
        var shipment = await _shipmentService.GetActiveShipmentAsync(driverId);

        if (shipment == null)
            return NotFound();

        return Ok(shipment);
    }

    [HttpPost("{shipmentId}/arrive")]
    public async Task<IActionResult> Arrive(Guid shipmentId)
    {
        try
        {
            await _shipmentService.ArriveAsync(shipmentId);
            return Ok("Araç sıraya alındı.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("status/{shipmentId}")]
    public async Task<IActionResult> GetStatus(Guid shipmentId)
    {
        var result = await _shipmentService.GetStatusAsync(shipmentId);

        if (result == null)
            return NotFound();

        return Ok(result);
    }
}