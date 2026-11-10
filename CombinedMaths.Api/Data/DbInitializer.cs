using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Data;

public static class DbInitializer
{
    public static void Initialize(AppDbContext context)
    {
        context.Database.EnsureCreated();

        // Ensure StoredFiles table and Papers.Section column exist on previously created databases
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

            context.Database.ExecuteSqlRaw("""
                ALTER TABLE "Papers" ADD COLUMN IF NOT EXISTS "Section" TEXT NOT NULL DEFAULT 'Full Papers';
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

            var conn = context.Database.GetDbConnection();
            var wasClosed = conn.State == System.Data.ConnectionState.Closed;
            if (wasClosed)
            {
                conn.Open();
            }

            try
            {
                var hasSection = false;
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = """PRAGMA table_info("Papers");""";
                    using var reader = cmd.ExecuteReader();
                    while (reader.Read())
                    {
                        if (string.Equals(reader["name"]?.ToString(), "Section", StringComparison.OrdinalIgnoreCase))
                        {
                            hasSection = true;
                            break;
                        }
                    }
                }

                if (!hasSection)
                {
                    context.Database.ExecuteSqlRaw("""
                        ALTER TABLE "Papers" ADD COLUMN "Section" TEXT NOT NULL DEFAULT 'Full Papers';
                        """);
                }
            }
            finally
            {
                if (wasClosed)
                {
                    conn.Close();
                }
            }
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
