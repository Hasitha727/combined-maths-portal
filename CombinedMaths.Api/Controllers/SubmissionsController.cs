using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Data;
using CombinedMaths.Api.DTOs;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SubmissionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SubmissionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Submission>>> GetSubmissions([FromQuery] string? paperId, [FromQuery] string? studentIndex)
    {
        var query = _context.Submissions.AsQueryable();

        if (!string.IsNullOrEmpty(paperId))
        {
            query = query.Where(s => s.PaperId == paperId);
        }

        if (!string.IsNullOrEmpty(studentIndex))
        {
            query = query.Where(s => s.StudentIndex == studentIndex);
        }

        var list = await query.ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Submission>> GetSubmission(string id)
    {
        var submission = await _context.Submissions.FindAsync(id);
        if (submission == null)
        {
            return NotFound();
        }
        return Ok(submission);
    }

    [HttpPost]
    public async Task<ActionResult<Submission>> Submit([FromBody] SubmitAnswerRequest request)
    {
        var now = DateTime.UtcNow;

        // Check if there is an active session
        var session = await _context.ExamSessions
            .Where(s => s.PaperId == request.PaperId && s.StudentIndex == request.StudentIndex && s.IsActive)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync();

        string status = "ON_TIME";
        int durationTaken = 1;
        int tabSwitches = request.TabSwitches;

        if (session != null)
        {
            tabSwitches = Math.Max(tabSwitches, session.TabSwitches);
            durationTaken = (int)Math.Max(1, Math.Round((now - session.StartedAt).TotalMinutes));

            if (now > session.HardCutoffAt)
            {
                status = "DISQUALIFIED";
            }
            else if (now > session.WritingEndsAt)
            {
                status = "LATE";
            }

            // Close session
            session.IsActive = false;
        }

        // Check if previous submission exists
        var existing = await _context.Submissions
            .FirstOrDefaultAsync(s => s.PaperId == request.PaperId && s.StudentIndex == request.StudentIndex);

        var submissionId = existing?.Id ?? $"sub-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";

        var submission = existing ?? new Submission();
        submission.Id = submissionId;
        submission.PaperId = request.PaperId;
        submission.StudentName = request.StudentName;
        submission.StudentIndex = request.StudentIndex;
        submission.StudentEmail = request.StudentEmail;
        var slTime = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(5.5));
        submission.SubmittedAt = slTime.ToString("dddd, d MMMM yyyy, h:mm tt");
        submission.Status = status;
        submission.DurationTakenMins = durationTaken;
        submission.FileName = request.FileName;
        submission.FilePath = request.FilePath ?? "";
        submission.FileSizeMb = request.FileSizeMb;
        submission.FilesCount = request.FilesCount;
        submission.TabSwitches = tabSwitches;
        submission.Marks = existing?.Marks;
        submission.Feedback = status == "DISQUALIFIED"
            ? "Grace period time limit violated."
            : (existing?.Feedback ?? "Pending lecturer review");

        if (existing == null)
        {
            _context.Submissions.Add(submission);
        }

        await _context.SaveChangesAsync();

        return Ok(submission);
    }

    [HttpPut("{id}/grade")]
    public async Task<ActionResult<Submission>> Grade(string id, [FromBody] GradeSubmissionRequest request)
    {
        var submission = await _context.Submissions.FindAsync(id);
        if (submission == null)
        {
            return NotFound(new { message = "Submission not found" });
        }

        submission.Marks = request.Marks;
        submission.Feedback = request.Feedback;

        await _context.SaveChangesAsync();

        return Ok(submission);
    }
}

