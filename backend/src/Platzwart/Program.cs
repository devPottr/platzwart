using Microsoft.EntityFrameworkCore;
using Platzwart.Auth;
using Platzwart.Data;
using Platzwart.Users;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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

app.Run();
