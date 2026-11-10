using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using CombinedMaths.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Resolve Database Connection (Priority: DATABASE_URL env var -> appsettings -> local SQLite)
var rawConnection = Environment.GetEnvironmentVariable("DATABASE_URL")?.Trim();
if (string.IsNullOrWhiteSpace(rawConnection))
{
    rawConnection = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=combinedmaths.db";
}

var isPostgresUri = rawConnection.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
                 || rawConnection.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase);
var isPostgresKv = rawConnection.Contains("Host=", StringComparison.OrdinalIgnoreCase);
var usePostgres = isPostgresUri || isPostgresKv;
var dbProvider = usePostgres ? "PostgreSQL" : "SQLite";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (usePostgres)
    {
        var pgConnString = isPostgresUri
            ? ConvertPostgresUriToConnectionString(rawConnection)
            : rawConnection;

        options.UseNpgsql(pgConnString, npgsql => npgsql.EnableRetryOnFailure(3));
    }
    else
    {
        options.UseSqlite(rawConnection);
    }
});

builder.Services.AddControllers();

// Configure CORS for Vite Frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVite", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Initialize and Seed Database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbInitializer.Initialize(context);
}

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowVite");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();

app.MapGet("/api/health", async (AppDbContext db) =>
{
    var canConnect = await db.Database.CanConnectAsync();
    return Results.Ok(new { status = canConnect ? "healthy" : "degraded", database = dbProvider });
});

app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();

static string ConvertPostgresUriToConnectionString(string uriString)
{
    var uri = new Uri(uriString);
    var userInfo = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(userInfo[0]);
    var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
    var database = uri.AbsolutePath.TrimStart('/');
    var port = uri.Port > 0 ? uri.Port : 5432;

    var npgsqlBuilder = new NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = port,
        Database = string.IsNullOrEmpty(database) ? "postgres" : database,
        Username = username,
        Password = password,
        SslMode = SslMode.Require
    };

    // Disable auto-prepare when using transaction pooler ports like Supabase 6543
    if (port == 6543)
    {
        npgsqlBuilder.MaxAutoPrepare = 0;
    }

    if (!string.IsNullOrWhiteSpace(uri.Query))
    {
        var query = QueryHelpers.ParseQuery(uri.Query);
        if (query.TryGetValue("sslmode", out var sslVal))
        {
            var mode = sslVal.ToString().ToLowerInvariant();
            npgsqlBuilder.SslMode = mode switch
            {
                "disable" => SslMode.Disable,
                "prefer" => SslMode.Prefer,
                "require" => SslMode.Require,
                "verify-ca" or "verifyca" => SslMode.VerifyCA,
                "verify-full" or "verifyfull" => SslMode.VerifyFull,
                _ => SslMode.Require
            };
        }
    }

    return npgsqlBuilder.ConnectionString;
}
