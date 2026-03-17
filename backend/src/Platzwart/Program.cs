using Microsoft.EntityFrameworkCore;
using Platzwart.Auth;
using Platzwart.Bookings;
using Platzwart.Data;
using Platzwart.Fields;
using Platzwart.Middleware;
using Platzwart.Teams;
using Platzwart.Users;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<TeamService>();
builder.Services.AddScoped<FieldService>();
builder.Services.AddScoped<BookingService>();

var app = builder.Build();

// Apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // Seed admin user if no users exist
    if (!await db.Users.AnyAsync())
    {
        db.Users.Add(new User
        {
            Email = "admin@platzwart.local",
            PasswordHash = PasswordHasher.Hash("admin123!"),
            DisplayName = "Administrator",
            Role = UserRole.Admin
        });
        await db.SaveChangesAsync();
    }
}

// Middleware pipeline
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<RateLimitMiddleware>();
app.UseMiddleware<CsrfMiddleware>();
app.UseMiddleware<SessionMiddleware>();

// Serve static files (built React app)
app.UseDefaultFiles();
app.UseStaticFiles();

// Map API endpoints
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapTeamEndpoints();
app.MapFieldEndpoints();
app.MapBookingEndpoints();

// SPA fallback - serve index.html for non-API routes
app.MapFallbackToFile("index.html");

app.Run();
