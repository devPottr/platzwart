using Platzwart.Auth;
using Platzwart.Users;

namespace Platzwart.Fields;

public static class FieldEndpoints
{
    public record FieldResponse(int Id, string Name, int GridCols, int GridRows, int SortOrder, List<SectionResponse> Sections);
    public record SectionResponse(int Id, int ColIndex, int RowIndex, string? Label);
    public record CreateFieldRequest(string Name, int GridCols, int GridRows);
    public record UpdateGridRequest(int GridCols, int GridRows);

    public static void MapFieldEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/fields");

        group.MapGet("/", async (FieldService service) =>
        {
            var fields = await service.GetAllAsync();
            return Results.Ok(fields.Select(ToResponse));
        }).RequireAuth();

        group.MapGet("/{id:int}", async (int id, FieldService service) =>
        {
            var field = await service.GetByIdAsync(id);
            return field is null ? Results.NotFound() : Results.Ok(ToResponse(field));
        }).RequireAuth();

        group.MapPost("/", async (CreateFieldRequest request, FieldService service) =>
        {
            if (request.GridCols < 1 || request.GridCols > 10 || request.GridRows < 1 || request.GridRows > 10)
                return Results.BadRequest(new { error = "Grid-Groesse muss zwischen 1x1 und 10x10 liegen" });

            var field = await service.CreateAsync(request.Name.Trim(), request.GridCols, request.GridRows);
            return Results.Created($"/api/fields/{field.Id}", ToResponse(field));
        }).RequireRole(UserRole.Admin);

        group.MapPut("/{id:int}/grid", async (int id, UpdateGridRequest request, FieldService service) =>
        {
            if (request.GridCols < 1 || request.GridCols > 10 || request.GridRows < 1 || request.GridRows > 10)
                return Results.BadRequest(new { error = "Grid-Groesse muss zwischen 1x1 und 10x10 liegen" });

            var field = await service.UpdateGridAsync(id, request.GridCols, request.GridRows);
            return field is null ? Results.NotFound() : Results.Ok(ToResponse(field));
        }).RequireRole(UserRole.Admin);
    }

    private static FieldResponse ToResponse(Field field) =>
        new(field.Id, field.Name, field.GridCols, field.GridRows, field.SortOrder,
            field.Sections.Select(s => new SectionResponse(s.Id, s.ColIndex, s.RowIndex, s.Label)).ToList());
}
