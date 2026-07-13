using FactoryQueue.Application.DTOs.Auth;
using FactoryQueue.Application.Exceptions;
using FactoryQueue.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace FactoryQueue.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            await _authService.RegisterAsync(request);
            return Ok("Kayıt başarılı.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("register/driver")]
    public async Task<IActionResult> RegisterDriver(RegisterRequest request)
    {
        try
        {
            await _authService.RegisterAsync(request);
            return Ok("Kaydınız oluşturuldu. Giriş yapabilirsiniz.");
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("register/admin")]
    public async Task<IActionResult> RegisterAdmin(AdminRegisterRequest request)
    {
        try
        {
            await _authService.RegisterAdminAsync(request);
            return Ok("Admin hesabınız oluşturuldu. Giriş yapabilirsiniz.");
        }
        catch (BusinessException ex)
        {
            return BadRequest(ex.Message);
        }
        catch
        {
            return StatusCode(500, "Beklenmeyen bir hata oluştu.");
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        return Ok(result);
    }

    [Authorize(Roles = "Driver")]
    [HttpPost("vehicle")]
    public async Task<IActionResult> SaveVehicleInfo(SaveVehicleInfoRequest request)
    {
        var driverIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(driverIdValue, out var driverId))
            return Unauthorized();

        try
        {
            await _authService.SaveVehicleInfoAsync(driverId, request);
            return Ok("Araç bilgileriniz kaydedildi.");
        }
        catch (BusinessException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (NotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
