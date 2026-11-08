namespace CombinedMaths.Api.Models;

public class Submission
{
    public string Id { get; set; } = string.Empty;
    public string PaperId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentIndex { get; set; } = string.Empty;
    public string StudentEmail { get; set; } = string.Empty;
    public string SubmittedAt { get; set; } = string.Empty;
    public string Status { get; set; } = "ON_TIME"; // ON_TIME | LATE | DISQUALIFIED
    public int DurationTakenMins { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty; // URL to download / view file
    public string FileSizeMb { get; set; } = string.Empty;
    public int FilesCount { get; set; } = 1;
    public int TabSwitches { get; set; } = 0;
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
}
