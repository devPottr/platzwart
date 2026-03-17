using Platzwart.Auth;
using Platzwart.Users;

namespace Platzwart.Bookings;

public static class BookingEndpoints
{
    public record BookingResponse(
        int Id, string Title, string BookingType, int? TeamId, string? TeamName, string? TeamColor,
        int BookedById, string BookedByName, DateTime StartTime, DateTime EndTime,
        string? Notes, int? RecurrenceId, List<SectionRef> Sections);
    public record SectionRef(int Id, int ColIndex, int RowIndex, string? Label);

    public static void MapBookingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/bookings");

        group.MapGet("/", async (int fieldId, string weekStart, BookingService service) =>
        {
            if (!DateOnly.TryParse(weekStart, out var date))
                return Results.BadRequest(new { error = "Ungueltiges Datum (YYYY-MM-DD)" });

            // Align to Monday
            var monday = date.AddDays(-(((int)date.DayOfWeek + 6) % 7));
            var bookings = await service.GetByFieldAndWeekAsync(fieldId, monday);
            return Results.Ok(bookings.Select(ToResponse));
        }).RequireAuth();

        group.MapGet("/{id:int}", async (int id, BookingService service) =>
        {
            var booking = await service.GetByIdAsync(id);
            return booking is null ? Results.NotFound() : Results.Ok(ToResponse(booking));
        }).RequireAuth();

        group.MapPost("/", async (BookingRequest request, BookingService service, HttpContext ctx) =>
        {
            var error = BookingValidation.Validate(request);
            if (error is not null) return Results.BadRequest(new { error });

            var user = ctx.GetRequiredUser();

            // Check permissions
            if (!CanCreateBooking(user, request))
                return Results.Json(new { error = "Keine Berechtigung fuer diese Buchung" }, statusCode: 403);

            // Check conflicts
            var conflicts = await service.FindConflictsAsync(
                request.StartTime.ToUniversalTime(), request.EndTime.ToUniversalTime(), request.SectionIds);
            if (conflicts.Count > 0)
                return Results.Conflict(new { error = "Zeitkonflikt", conflictingSectionIds = conflicts });

            var booking = await service.CreateAsync(request, user.Id);
            return Results.Created($"/api/bookings/{booking.Id}", ToResponse(booking));
        }).RequireRole(UserRole.Trainer);

        group.MapPut("/{id:int}", async (int id, BookingRequest request, BookingService service, HttpContext ctx) =>
        {
            var error = BookingValidation.Validate(request);
            if (error is not null) return Results.BadRequest(new { error });

            var user = ctx.GetRequiredUser();
            var existing = await service.GetByIdAsync(id);
            if (existing is null) return Results.NotFound();

            // Only admin/platzwart can edit others' bookings
            if (existing.BookedById != user.Id && user.Role < UserRole.Platzwart)
                return Results.Json(new { error = "Keine Berechtigung" }, statusCode: 403);

            var conflicts = await service.FindConflictsAsync(
                request.StartTime.ToUniversalTime(), request.EndTime.ToUniversalTime(), request.SectionIds, id);
            if (conflicts.Count > 0)
                return Results.Conflict(new { error = "Zeitkonflikt", conflictingSectionIds = conflicts });

            var booking = await service.UpdateAsync(id, request);
            return Results.Ok(ToResponse(booking!));
        }).RequireRole(UserRole.Trainer);

        group.MapDelete("/{id:int}", async (int id, BookingService service, HttpContext ctx) =>
        {
            var user = ctx.GetRequiredUser();
            var existing = await service.GetByIdAsync(id);
            if (existing is null) return Results.NotFound();

            if (existing.BookedById != user.Id && user.Role < UserRole.Platzwart)
                return Results.Json(new { error = "Keine Berechtigung" }, statusCode: 403);

            return await service.DeleteAsync(id) ? Results.NoContent() : Results.NotFound();
        }).RequireRole(UserRole.Trainer);

        group.MapDelete("/series/{recurrenceId:int}", async (int recurrenceId, BookingService service, HttpContext ctx) =>
        {
            var user = ctx.GetRequiredUser();
            if (user.Role < UserRole.Platzwart)
                return Results.Json(new { error = "Keine Berechtigung" }, statusCode: 403);

            var count = await service.DeleteSeriesAsync(recurrenceId);
            return Results.Ok(new { deleted = count });
        }).RequireRole(UserRole.Platzwart);
    }

    private static bool CanCreateBooking(User user, BookingRequest request)
    {
        var type = Enum.Parse<BookingType>(request.BookingType, true);
        // Maintenance/Locked requires Platzwart+
        if (type is BookingType.Maintenance or BookingType.Locked)
            return user.Role >= UserRole.Platzwart;
        return true;
    }

    private static BookingResponse ToResponse(Booking b) =>
        new(b.Id, b.Title, b.BookingType.ToString().ToLowerInvariant(),
            b.TeamId, b.Team?.Name, b.Team?.Color,
            b.BookedById, b.BookedBy.DisplayName,
            b.StartTime, b.EndTime, b.Notes, b.RecurrenceId,
            b.BookingSections.Select(bs =>
                new SectionRef(bs.SectionId, bs.Section.ColIndex, bs.Section.RowIndex, bs.Section.Label)).ToList());
}
