using Microsoft.EntityFrameworkCore;
using Platzwart.Data;
using Platzwart.Users;

namespace Platzwart.Auth;

public class SessionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, AppDbContext db)
    {
        var cookieName = context.RequestServices
            .GetRequiredService<IConfiguration>()
            .GetValue<string>("Session:CookieName") ?? "platzwart_session";

        if (context.Request.Cookies.TryGetValue(cookieName, out var sessionToken)
            && !string.IsNullOrEmpty(sessionToken))
        {
            var session = await db.Sessions
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == sessionToken && s.ExpiresAt > DateTime.UtcNow);

            if (session?.User.IsActive == true)
            {
                context.Items["User"] = session.User;
                context.Items["SessionId"] = session.Id;
            }
        }

        await next(context);
    }
}

public static class HttpContextExtensions
{
    public static User? GetCurrentUser(this HttpContext context) =>
        context.Items["User"] as User;

    public static User GetRequiredUser(this HttpContext context) =>
        context.GetCurrentUser() ?? throw new UnauthorizedAccessException();

    public static bool HasMinRole(this HttpContext context, UserRole minRole) =>
        context.GetCurrentUser()?.Role >= minRole;
}
