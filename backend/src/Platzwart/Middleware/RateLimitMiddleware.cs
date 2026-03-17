using System.Collections.Concurrent;

namespace Platzwart.Middleware;

public class RateLimitMiddleware(RequestDelegate next)
{
    private static readonly ConcurrentDictionary<string, RateInfo> Clients = new();
    private const int MaxAttempts = 5;
    private static readonly TimeSpan Window = TimeSpan.FromMinutes(1);

    public async Task InvokeAsync(HttpContext context)
    {
        // Only rate limit login endpoint
        if (context.Request.Path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase)
            && context.Request.Method == "POST")
        {
            var ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var now = DateTime.UtcNow;

            var info = Clients.GetOrAdd(ip, _ => new RateInfo());
            lock (info)
            {
                if (now - info.WindowStart > Window)
                {
                    info.WindowStart = now;
                    info.Count = 0;
                }

                info.Count++;
                if (info.Count > MaxAttempts)
                {
                    context.Response.StatusCode = 429;
                    context.Response.WriteAsJsonAsync(new { error = "Zu viele Anmeldeversuche. Bitte spaeter erneut versuchen." });
                    return;
                }
            }
        }

        await next(context);
    }

    private class RateInfo
    {
        public DateTime WindowStart = DateTime.UtcNow;
        public int Count;
    }
}
