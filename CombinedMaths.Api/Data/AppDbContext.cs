using Microsoft.EntityFrameworkCore;
using CombinedMaths.Api.Models;

namespace CombinedMaths.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Paper> Papers => Set<Paper>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<ExamSession> ExamSessions => Set<ExamSession>();
    public DbSet<StoredFile> StoredFiles => Set<StoredFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasKey(u => u.Id);
        modelBuilder.Entity<Paper>().HasKey(p => p.Id);
        modelBuilder.Entity<Submission>().HasKey(s => s.Id);
        modelBuilder.Entity<ExamSession>().HasKey(e => e.Id);
        modelBuilder.Entity<StoredFile>().HasKey(f => f.Id);
    }
}

