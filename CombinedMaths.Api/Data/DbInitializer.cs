using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        // Ensure StoredFiles table exists even on previously created databases
        if (context.Database.IsNpgsql())
        {
            context.Database.ExecuteSqlRaw("""
                CREATE TABLE IF NOT EXISTS "StoredFiles" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_StoredFiles" PRIMARY KEY,
                    "FileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "Folder" TEXT NOT NULL,
                    "Data" BYTEA NOT NULL,
                    "SizeBytes" BIGINT NOT NULL,
                    "CreatedAt" TIMESTAMPTZ NOT NULL
                );
                """);
        }
        else if (context.Database.IsSqlite())
        {
            context.Database.ExecuteSqlRaw("""
                CREATE TABLE IF NOT EXISTS "StoredFiles" (
                    "Id" TEXT NOT NULL CONSTRAINT "PK_StoredFiles" PRIMARY KEY,
                    "FileName" TEXT NOT NULL,
                    "ContentType" TEXT NOT NULL,
                    "Folder" TEXT NOT NULL,
                    "Data" BLOB NOT NULL,
                    "SizeBytes" INTEGER NOT NULL,
                    "CreatedAt" TEXT NOT NULL
                );
                """);
        }

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
