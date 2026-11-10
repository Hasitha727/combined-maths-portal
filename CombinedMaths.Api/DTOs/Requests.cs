namespace CombinedMaths.Api.DTOs;

public record LoginRequest(string UserId);

public record LoginCredentialsRequest(string Identifier, string Password);

public record RegisterStudentRequest(
    string Name,
    string Email,
    string PhoneNumber,
    string IndexNo,
    string Password
);

public record CreatePaperRequest(
    string Title,
    string Subject,
    int DurationMinutes,
    int GracePeriodMinutes,
    string? DueDate,
    string? PdfUrl,
    string? PdfFileName,
    string? Instructions,
    int? TotalMarks,
    string? Section = null
);

public record StartExamRequest(
    string PaperId,
    string StudentIndex
);

public record SubmitAnswerRequest(
    string PaperId,
    string StudentIndex,
    string StudentName,
    string StudentEmail,
    string FileName,
    string? FilePath,
    string FileSizeMb,
    int FilesCount,
    int TabSwitches
);

public record GradeSubmissionRequest(
    int Marks,
    string Feedback
);

public record UploadResultDto(
    string FileName,
    string FileUrl,
    string FileSizeMb
);
