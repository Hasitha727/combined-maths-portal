using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        // Ensure teacher account exists
        if (!context.Users.Any(u => u.Role == "teacher"))
        {
            var teacher = new User
            {
                Id = "usr-teacher-01",
                Name = "Teacher / Course Lecturer",
                Role = "teacher",
                RoleTitle = "Course Lecturer (Combined Mathematics)",
                Email = "teacher@maths.lk",
                PhoneNumber = "0771234567",
                Initials = "TC",
                Password = "admin",
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(teacher);
            context.SaveChanges();
        }
    }
}
