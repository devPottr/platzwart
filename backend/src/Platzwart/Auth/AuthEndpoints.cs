using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Platzwart.Data;
using Platzwart.Users;

namespace Platzwart.Auth;

public static class AuthEndpoints
{
    public record LoginRequest(string Email, string Password);
    public record RegisterRequest(string Email, string Password, string DisplayName);
    public record UserResponse(int Id, string Email, string DisplayName, string Role);

    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/login", async (LoginRequest request, AppDbContext db, HttpContext ctx, IConfiguration config) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLowerInvariant());
            if (user is null || !user.IsActive || !PasswordHasher.Verify(request.Password, user.PasswordHash))
                return Results.Json(new { error = "Ungueltige Anmeldedaten" }, statusCode: 401);

            var session = await CreateSession(db, user, config);
            SetSessionCookie(ctx, session, config);

            return Results.Ok(ToResponse(user));
        });

        group.MapPost("/register", async (RegisterRequest request, AppDbContext db, HttpContext ctx, IConfiguration config) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == email))
                return Results.Json(new { error = "E-Mail bereits registriert" }, statusCode: 409);

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                return Results.Json(new { error = "Passwort muss mindestens 8 Zeichen lang sein" }, statusCode: 400);

            var user = new User
            {
                Email = email,
                PasswordHash = PasswordHasher.Hash(request.Password),
                DisplayName = request.DisplayName.Trim(),
                Role = UserRole.Member
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            var session = await CreateSession(db, user, config);
            SetSessionCookie(ctx, session, config);

            return Results.Created($"/api/users/{user.Id}", ToResponse(user));
        });

        group.MapPost("/logout", async (HttpContext ctx, AppDbContext db, IConfiguration config) =>
        {
            var sessionId = ctx.Items["SessionId"] as string;
            if (sessionId is not null)
            {
                var session = await db.Sessions.FindAsync(sessionId);
                if (session is not null)
                {
                    db.Sessions.Remove(session);
                    await db.SaveChangesAsync();
                }
            }

            var cookieName = config.GetValue<string>("Session:CookieName") ?? "platzwart_session";
            ctx.Response.Cookies.Delete(cookieName);

            return Results.Ok(new { message = "Abgemeldet" });
        });

        group.MapGet("/me", (HttpContext ctx) =>
        {
            var user = ctx.GetCurrentUser();
            return user is null
                ? Results.Json(new { error = "Nicht authentifiziert" }, statusCode: 401)
                : Results.Ok(ToResponse(user));
        });
    }

    private static async Task<Session> CreateSession(AppDbContext db, User user, IConfiguration config)
    {
        var lifetimeHours = config.GetValue<int>("Session:LifetimeHours", 24);
        var session = new Session
        {
            Id = GenerateSessionToken(),
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddHours(lifetimeHours)
        };
        db.Sessions.Add(session);
        await db.SaveChangesAsync();
        return session;
    }

    private static void SetSessionCookie(HttpContext ctx, Session session, IConfiguration config)
    {
        var isDev = ctx.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment();
        var cookieName = config.GetValue<string>("Session:CookieName") ?? "platzwart_session";
        ctx.Response.Cookies.Append(cookieName, session.Id, new CookieOptions
        {
            HttpOnly = true,
            Secure = !isDev,
            SameSite = SameSiteMode.Strict,
            Expires = session.ExpiresAt
        });
    }

    private static string GenerateSessionToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.DisplayName, user.Role.ToString().ToLowerInvariant());
}
