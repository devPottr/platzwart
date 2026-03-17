using System.Security.Cryptography;

namespace Platzwart.Middleware;

public class CsrfMiddleware(RequestDelegate next)
{
    private const string CookieName = "XSRF-TOKEN";
    private const string HeaderName = "X-XSRF-TOKEN";

    private static readonly HashSet<string> SafeMethods = ["GET", "HEAD", "OPTIONS"];

    // Pre-auth endpoints don't need CSRF protection (no session to hijack)
    private static readonly HashSet<string> ExemptPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/logout"
    };

    public async Task InvokeAsync(HttpContext context)
    {
        var isDev = context.RequestServices.GetRequiredService<IWebHostEnvironment>().IsDevelopment();

        // Always set the CSRF cookie (readable by JS)
        if (!context.Request.Cookies.ContainsKey(CookieName))
        {
            var token = Convert.ToHexStringLower(RandomNumberGenerator.GetBytes(32));
            context.Response.Cookies.Append(CookieName, token, new CookieOptions
            {
                HttpOnly = false,
                Secure = !isDev,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });
        }

        // Validate on state-changing methods (skip pre-auth endpoints)
        if (!SafeMethods.Contains(context.Request.Method)
            && context.Request.Path.StartsWithSegments("/api")
            && !ExemptPaths.Contains(context.Request.Path.Value ?? ""))
        {
            var cookieToken = context.Request.Cookies[CookieName];
            var headerToken = context.Request.Headers[HeaderName].FirstOrDefault();

            if (string.IsNullOrEmpty(cookieToken) || cookieToken != headerToken)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "CSRF-Token ungueltig" });
                return;
            }
        }

        await next(context);
    }
}
