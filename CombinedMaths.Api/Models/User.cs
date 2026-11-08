namespace CombinedMaths.Api.Models;

public class User
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "teacher" | "student"
    public string RoleTitle { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? IndexNo { get; set; }
    public string Initials { get; set; } = string.Empty;
    public string Password { get; set; } = "123456"; // Default / hashed password
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
