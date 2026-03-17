using Platzwart.Auth;
using Platzwart.Users;

namespace Platzwart.Teams;

public static class TeamEndpoints
{
    public record TeamResponse(int Id, string Name, string Color, int SortOrder, List<MemberResponse> Members);
    public record MemberResponse(int UserId, string DisplayName, bool IsLead);
    public record CreateTeamRequest(string Name, string Color);
    public record UpdateTeamRequest(string Name, string Color);
    public record AddMemberRequest(int UserId, bool IsLead);

    public static void MapTeamEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/teams");

        group.MapGet("/", async (TeamService service) =>
        {
            var teams = await service.GetAllAsync();
            return Results.Ok(teams.Select(ToResponse));
        }).RequireAuth();

        group.MapGet("/{id:int}", async (int id, TeamService service) =>
        {
            var team = await service.GetByIdAsync(id);
            return team is null ? Results.NotFound() : Results.Ok(ToResponse(team));
        }).RequireAuth();

        group.MapPost("/", async (CreateTeamRequest request, TeamService service) =>
        {
            var team = await service.CreateAsync(request.Name.Trim(), request.Color.Trim());
            return Results.Created($"/api/teams/{team.Id}", ToResponse(team));
        }).RequireRole(UserRole.Platzwart);

        group.MapPut("/{id:int}", async (int id, UpdateTeamRequest request, TeamService service) =>
        {
            var team = await service.UpdateAsync(id, request.Name.Trim(), request.Color.Trim());
            return team is null ? Results.NotFound() : Results.Ok(ToResponse(team));
        }).RequireRole(UserRole.Platzwart);

        group.MapDelete("/{id:int}", async (int id, TeamService service) =>
        {
            return await service.DeleteAsync(id) ? Results.NoContent() : Results.NotFound();
        }).RequireRole(UserRole.Platzwart);

        group.MapPost("/{id:int}/members", async (int id, AddMemberRequest request, TeamService service) =>
        {
            return await service.AddMemberAsync(id, request.UserId, request.IsLead)
                ? Results.Created()
                : Results.Conflict(new { error = "Mitglied bereits im Team" });
        }).RequireRole(UserRole.Platzwart);

        group.MapDelete("/{teamId:int}/members/{userId:int}", async (int teamId, int userId, TeamService service) =>
        {
            return await service.RemoveMemberAsync(teamId, userId) ? Results.NoContent() : Results.NotFound();
        }).RequireRole(UserRole.Platzwart);
    }

    private static TeamResponse ToResponse(Team team) =>
        new(team.Id, team.Name, team.Color, team.SortOrder,
            team.Members.Select(m => new MemberResponse(m.UserId, m.User.DisplayName, m.IsLead)).ToList());
}
