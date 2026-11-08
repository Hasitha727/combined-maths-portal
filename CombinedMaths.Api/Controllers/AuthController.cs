using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Data;
using CombinedMaths.Api.DTOs;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        var users = await _context.Users.ToListAsync();
        return Ok(users);
    }

    [HttpPost("login")]
    public async Task<ActionResult<User>> Login([FromBody] LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }
        return Ok(user);
    }

    [HttpPost("login-credentials")]
    public async Task<ActionResult<User>> LoginWithCredentials([FromBody] LoginCredentialsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username/Email and Password are required." });
        }

        var trimmed = request.Identifier.Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.Email.ToLower() == trimmed.ToLower() || 
            (u.IndexNo != null && u.IndexNo.ToLower() == trimmed.ToLower())
        );

        if (user == null)
        {
            return BadRequest(new { message = "Invalid email or index number." });
        }

        if (user.Password != request.Password)
        {
            return BadRequest(new { message = "Incorrect password." });
        }

        return Ok(user);
    }

    [HttpPost("register")]
    public async Task<ActionResult<User>> Register([FromBody] RegisterStudentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || 
            string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.IndexNo) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Please fill in all required fields." });
        }

        var emailLower = request.Email.Trim().ToLower();
        var indexTrimmed = request.IndexNo.Trim();

        var exists = await _context.Users.AnyAsync(u => 
            u.Email.ToLower() == emailLower || 
            (u.IndexNo != null && u.IndexNo.ToLower() == indexTrimmed.ToLower())
        );

        if (exists)
        {
            return BadRequest(new { message = "An account with this Email or Index Number already exists." });
        }

        // Generate Initials
        var parts = request.Name.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var initials = parts.Length switch
        {
            0 => "ST",
            1 => parts[0][0].ToString().ToUpper(),
            _ => (parts[0][0].ToString() + parts[^1][0].ToString()).ToUpper()
        };

        var user = new User
        {
            Id = $"usr-student-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Name = request.Name.Trim(),
            Email = emailLower,
            PhoneNumber = request.PhoneNumber?.Trim(),
            IndexNo = indexTrimmed,
            Role = "student",
            RoleTitle = "Student (Combined Maths)",
            Initials = initials,
            Password = request.Password,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return Ok(user);
    }
}
