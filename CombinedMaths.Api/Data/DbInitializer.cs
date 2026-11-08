using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        if (!context.Users.Any())
        {
            var users = new[]
            {
                new User
                {
                    Id = "usr-teacher-01",
                    Name = "Eng. K. A. Perera",
                    Role = "teacher",
                    RoleTitle = "Teacher / Course Lecturer",
                    Email = "k.perera@maths.lk",
                    Initials = "KP"
                },
                new User
                {
                    Id = "usr-student-01",
                    Name = "Dilshan Rajapaksha",
                    Role = "student",
                    RoleTitle = "Student (2026 A/L Batch)",
                    Email = "cm26089@student.maths.lk",
                    IndexNo = "CM-2026-089",
                    Initials = "DR"
                },
                new User
                {
                    Id = "usr-student-02",
                    Name = "Kavindu Theekshana",
                    Role = "student",
                    RoleTitle = "Student (2026 A/L Batch)",
                    Email = "cm26042@student.maths.lk",
                    IndexNo = "CM-26-042",
                    Initials = "KT"
                }
            };

            context.Users.AddRange(users);
        }

        if (!context.Papers.Any())
        {
            var papers = new[]
            {
                new Paper
                {
                    Id = "paper-2026-01",
                    Code = "CM-26-P01",
                    Title = "Model Paper 01 - Pure Mathematics (Calculus, Trigonometry & Induction)",
                    Subject = "Pure Mathematics",
                    CourseName = "Combined Mathematics 2026 (A/L)",
                    DurationMinutes = 180,
                    GracePeriodMinutes = 15,
                    OpenedDate = "Tuesday, 20 October 2026, 6:00 PM",
                    DueDate = "Wednesday, 4 November 2026, 11:59 PM",
                    PdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    PdfFileName = "Model_Paper_01_Pure_Mathematics.pdf",
                    PdfFileSize = "2.4 MB",
                    Instructions = "සියලුම ප්‍රශ්න වලට පිළිතුරු සපයන්න. පැහැදිලි පියවර සටහන් කරන්න. 'Start Exam' බොත්තම එබූ විගස පමණක් ප්‍රශ්න පත්‍රය විවෘත වන අතර නියමිත කාලය ගණනය වීම ආරම්භ වේ.",
                    TotalMarks = 100
                },
                new Paper
                {
                    Id = "paper-2026-02",
                    Code = "CM-26-A04",
                    Title = "Speed Revision Test 04 - Applied Maths (Relative Velocity & Dynamics)",
                    Subject = "Applied Mathematics",
                    CourseName = "Combined Mathematics 2026 (A/L)",
                    DurationMinutes = 60,
                    GracePeriodMinutes = 10,
                    OpenedDate = "Thursday, 22 October 2026, 4:00 PM",
                    DueDate = "Thursday, 5 November 2026, 11:59 PM",
                    PdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    PdfFileName = "Speed_Revision_Test_04_Applied.pdf",
                    PdfFileSize = "1.8 MB",
                    Instructions = "ගුරුත්වාකර්ශන ත්වරණය g = 10 m/s² ලෙස ගන්න. ප්‍රවේග-කාල ප්‍රස්තාර අනිවාර්ය වේ. රූප සටහන් පැහැදිලිව අඳින්න.",
                    TotalMarks = 50
                }
            };

            context.Papers.AddRange(papers);
        }

        if (!context.Submissions.Any())
        {
            var submissions = new[]
            {
                new Submission
                {
                    Id = "sub-001",
                    PaperId = "paper-2026-02",
                    StudentName = "Kavindu Theekshana",
                    StudentIndex = "CM-26-042",
                    StudentEmail = "cm26042@student.maths.lk",
                    SubmittedAt = "Thursday, 22 October 2026, 5:12 PM",
                    Status = "ON_TIME",
                    DurationTakenMins = 52,
                    FileName = "Kavindu_Applied_SpeedTest04.pdf",
                    FileSizeMb = "4.8 MB",
                    FilesCount = 1,
                    TabSwitches = 0,
                    Marks = 46,
                    Feedback = "Excellent graphical analysis in Q2. Step presentation is top tier."
                }
            };

            context.Submissions.AddRange(submissions);
        }

        context.SaveChanges();
    }
}

