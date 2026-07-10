using FactoryQueue.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FactoryQueue.Api.Controllers;

[ApiController]
[Route("api/Admin/shipments")]
[Authorize(Roles = "Admin")]
public class AdminShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;
    public AdminShipmentsController(IShipmentService shipmentService) => _shipmentService = shipmentService;
    [HttpGet] public async Task<IActionResult> GetAll() => Ok(await _shipmentService.GetAdminShipmentsAsync());
    [HttpGet("{shipmentId:guid}")] public async Task<IActionResult> Get(Guid shipmentId)
    {
        var shipment = await _shipmentService.GetAdminShipmentAsync(shipmentId);
        return shipment is null ? NotFound("Sevkiyat bulunamadı.") : Ok(shipment);
    }
}
