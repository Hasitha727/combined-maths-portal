using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Data;
using CombinedMaths.Api.DTOs;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExamSessionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ExamSessionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("active")]
    public async Task<ActionResult<ExamSession?>> GetActiveSession([FromQuery] string studentIndex, [FromQuery] string paperId)
    {
        var session = await _context.ExamSessions
            .Where(s => s.StudentIndex == studentIndex && s.PaperId == paperId && s.IsActive)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        return Ok(session);
    }

    [HttpPost("start")]
    public async Task<ActionResult<ExamSession>> Start([FromBody] StartExamRequest request)
    {
        var paper = await _context.Papers.FindAsync(request.PaperId);
        if (paper == null)
        {
            return NotFound(new { message = "Paper not found" });
        }

        // Close any existing active sessions for this student & paper
        var existingSessions = await _context.ExamSessions
            .Where(s => s.StudentIndex == request.StudentIndex && s.PaperId == request.PaperId && s.IsActive)
            .ToListAsync();

        foreach (var s in existingSessions)
        {
            s.IsActive = false;
        }

        var now = DateTime.UtcNow;
        var writingEndsAt = now.AddMinutes(paper.DurationMinutes);
        var hardCutoffAt = now.AddMinutes(paper.DurationMinutes + paper.GracePeriodMinutes);

        var session = new ExamSession
        {
            PaperId = paper.Id,
            StudentIndex = request.StudentIndex,
            StartedAt = now,
            WritingEndsAt = writingEndsAt,
            HardCutoffAt = hardCutoffAt,
            DurationMinutes = paper.DurationMinutes,
            GracePeriodMinutes = paper.GracePeriodMinutes,
            TabSwitches = 0,
            IsActive = true
        };

        _context.ExamSessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(session);
    }

    [HttpPost("{id}/tab-switch")]
    public async Task<ActionResult<ExamSession>> LogTabSwitch(int id)
    {
        var session = await _context.ExamSessions.FindAsync(id);
        if (session == null)
        {
            return NotFound(new { message = "Session not found" });
        }

        session.TabSwitches += 1;
        await _context.SaveChangesAsync();

        return Ok(session);
    }
}

