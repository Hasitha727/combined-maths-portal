using Microsoft.AspNetCore.Mvc;
using Microsoft.Net.Http.Headers;
using CombinedMaths.Api.Data;
using CombinedMaths.Api.DTOs;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly AppDbContext _context;

    public FilesController(AppDbContext context)
    {
        _context = context;
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

        var contentType = ext switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        var fileId = $"file-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString("N")[..8]}";
        var storedFile = new StoredFile
        {
            Id = fileId,
            FileName = file.FileName,
            ContentType = contentType,
            Folder = string.IsNullOrWhiteSpace(folder) ? "general" : folder,
            Data = bytes,
            SizeBytes = bytes.LongLength,
            CreatedAt = DateTime.UtcNow
        };

        _context.StoredFiles.Add(storedFile);
        await _context.SaveChangesAsync();

        var fileSizeMb = $"{Math.Round((double)bytes.LongLength / (1024 * 1024), 2)} MB";
        var fileUrl = $"/api/files/{storedFile.Id}";

        return Ok(new UploadResultDto(
            FileName: storedFile.FileName,
            FileUrl: fileUrl,
            FileSizeMb: fileSizeMb
        ));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFile(string id, [FromQuery] bool download = false)
    {
        var storedFile = await _context.StoredFiles.FindAsync(id);
        if (storedFile == null)
        {
            return NotFound(new { message = "File not found." });
        }

        var contentDisposition = new ContentDispositionHeaderValue(download ? "attachment" : "inline");
        contentDisposition.SetHttpFileName(storedFile.FileName);
        Response.Headers["Content-Disposition"] = contentDisposition.ToString();

        return File(storedFile.Data, storedFile.ContentType, enableRangeProcessing: true);
    }
}
