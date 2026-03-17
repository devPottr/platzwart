using Platzwart.Users;

namespace Platzwart.Auth;

public static class RoleRequirement
{
    public static Func<HttpContext, bool> MinRole(UserRole minRole) =>
        ctx => ctx.HasMinRole(minRole);

    public static IEndpointConventionBuilder RequireRole(this IEndpointConventionBuilder builder, UserRole minRole)
    {
        return builder.AddEndpointFilter(async (context, next) =>
        {
            var user = context.HttpContext.GetCurrentUser();
            if (user is null)
                return Results.Json(new { error = "Nicht authentifiziert" }, statusCode: 401);
            if (user.Role < minRole)
                return Results.Json(new { error = "Keine Berechtigung" }, statusCode: 403);
            return await next(context);
        });
    }

    public static IEndpointConventionBuilder RequireAuth(this IEndpointConventionBuilder builder)
    {
        return builder.AddEndpointFilter(async (context, next) =>
        {
            var user = context.HttpContext.GetCurrentUser();
            if (user is null)
                return Results.Json(new { error = "Nicht authentifiziert" }, statusCode: 401);
            return await next(context);
        });
    }
}
