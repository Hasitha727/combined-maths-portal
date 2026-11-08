namespace CombinedMaths.Api.Models;

public class Paper
{
    public string Id { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string CourseName { get; set; } = "Combined Mathematics 2026 (A/L)";
    public int DurationMinutes { get; set; }
    public int GracePeriodMinutes { get; set; } = 15;
    public string OpenedDate { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public string PdfUrl { get; set; } = string.Empty;
    public string PdfFileName { get; set; } = string.Empty;
    public string PdfFileSize { get; set; } = "2.5 MB";
    public string Instructions { get; set; } = string.Empty;
    public int TotalMarks { get; set; } = 100;
}

