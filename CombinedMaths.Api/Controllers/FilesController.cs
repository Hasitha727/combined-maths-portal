using Microsoft.AspNetCore.Mvc;
using CombinedMaths.Api.DTOs;

namespace CombinedMaths.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    public FilesController(IWebHostEnvironment env)
    {
        _env = env;
    }

    [HttpPost("upload")]
    [RequestSizeLimit(35 * 1024 * 1024)] // 35 MB max
    public async Task<ActionResult<UploadResultDto>> UploadFile([FromForm] IFormFile file, [FromQuery] string folder = "general")
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file was uploaded." });
        }

        // Allowed extensions
        var allowedExts = new[] { ".pdf", ".png", ".jpg", ".jpeg", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExts.Contains(ext))
        {
            return BadRequest(new { message = "Only PDF, PNG, and JPG files are supported." });
        }

        // Create folder inside wwwroot/uploads/{folder}
        var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", folder);
        if (!Directory.Exists(uploadsDir))
        {
            Directory.CreateDirectory(uploadsDir);
        }

        // Generate unique filename
        var safeOriginalName = Path.GetFileNameWithoutExtension(file.FileName).Replace(" ", "_");
        var uniqueFileName = $"{safeOriginalName}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
        var physicalPath = Path.Combine(uploadsDir, uniqueFileName);

        using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileSizeMb = $"{Math.Round((double)file.Length / (1024 * 1024), 2)} MB";
        var fileUrl = $"/uploads/{folder}/{uniqueFileName}";

        return Ok(new UploadResultDto(
            FileName: file.FileName,
            FileUrl: fileUrl,
            FileSizeMb: fileSizeMb
        ));
    }
}

