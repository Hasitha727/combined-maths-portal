using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Data;
using CombinedMaths.Api.DTOs;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PapersController : ControllerBase
{
    private readonly AppDbContext _context;

    public PapersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Paper>>> GetPapers()
    {
        var papers = await _context.Papers.ToListAsync();
        return Ok(papers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Paper>> GetPaper(string id)
    {
        var paper = await _context.Papers.FindAsync(id);
        if (paper == null)
        {
            return NotFound();
        }
        return Ok(paper);
    }

    [HttpPost]
    public async Task<ActionResult<Paper>> CreatePaper([FromBody] CreatePaperRequest request)
    {
        var count = await _context.Papers.CountAsync();
        var paper = new Paper
        {
            Id = $"paper-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            Code = $"CM-26-P{count + 1}",
            Title = request.Title,
            Subject = request.Subject,
            CourseName = "Combined Mathematics 2026 (A/L)",
            DurationMinutes = request.DurationMinutes,
            GracePeriodMinutes = request.GracePeriodMinutes > 0 ? request.GracePeriodMinutes : 15,
            OpenedDate = DateTime.Now.ToString("dddd, d MMMM yyyy, h:mm tt"),
            DueDate = !string.IsNullOrWhiteSpace(request.DueDate) ? request.DueDate : DateTime.Now.AddDays(7).ToString("dddd, d MMMM yyyy, 11:59 PM"),
            PdfUrl = !string.IsNullOrWhiteSpace(request.PdfUrl) ? request.PdfUrl : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            PdfFileName = !string.IsNullOrWhiteSpace(request.PdfFileName) ? request.PdfFileName : "Model_Paper.pdf",
            PdfFileSize = "2.5 MB",
            Instructions = !string.IsNullOrWhiteSpace(request.Instructions) ? request.Instructions : "සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න.",
            TotalMarks = request.TotalMarks ?? 100
        };

        _context.Papers.Add(paper);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPaper), new { id = paper.Id }, paper);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePaper(string id)
    {
        var paper = await _context.Papers.FindAsync(id);
        if (paper == null)
        {
            return NotFound();
        }

        // Also delete any submissions or exam sessions associated with this paper
        var submissions = await _context.Submissions.Where(s => s.PaperId == id).ToListAsync();
        _context.Submissions.RemoveRange(submissions);

        var sessions = await _context.ExamSessions.Where(s => s.PaperId == id).ToListAsync();
        _context.ExamSessions.RemoveRange(sessions);

        _context.Papers.Remove(paper);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

