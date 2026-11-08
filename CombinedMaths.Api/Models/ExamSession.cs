namespace CombinedMaths.Api.Models;

public class ExamSession
{
    public int Id { get; set; }
    public string PaperId { get; set; } = string.Empty;
    public string StudentIndex { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime WritingEndsAt { get; set; }
    public DateTime HardCutoffAt { get; set; }
    public int DurationMinutes { get; set; }
    public int GracePeriodMinutes { get; set; }
    public int TabSwitches { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

