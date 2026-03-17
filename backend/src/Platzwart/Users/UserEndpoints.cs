using Platzwart.Auth;

namespace Platzwart.Users;

public static class UserEndpoints
{
    public record UserResponse(int Id, string Email, string DisplayName, string Role, bool IsActive);
    public record UpdateRoleRequest(string Role);
    public record SetActiveRequest(bool IsActive);

    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users");

        group.MapGet("/", async (UserService service) =>
        {
            var users = await service.GetAllAsync();
            return Results.Ok(users.Select(ToResponse));
        }).RequireRole(UserRole.Admin);

        group.MapGet("/{id:int}", async (int id, UserService service) =>
        {
            var user = await service.GetByIdAsync(id);
            return user is null ? Results.NotFound() : Results.Ok(ToResponse(user));
        }).RequireRole(UserRole.Admin);

        group.MapPut("/{id:int}/role", async (int id, UpdateRoleRequest request, UserService service) =>
        {
            if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
                return Results.BadRequest(new { error = "Ungueltige Rolle" });

            var user = await service.UpdateRoleAsync(id, role);
            return user is null ? Results.NotFound() : Results.Ok(ToResponse(user));
        }).RequireRole(UserRole.Admin);

        group.MapPut("/{id:int}/active", async (int id, SetActiveRequest request, UserService service) =>
        {
            var user = await service.SetActiveAsync(id, request.IsActive);
            return user is null ? Results.NotFound() : Results.Ok(ToResponse(user));
        }).RequireRole(UserRole.Admin);
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Email, user.DisplayName, user.Role.ToString().ToLowerInvariant(), user.IsActive);
}
