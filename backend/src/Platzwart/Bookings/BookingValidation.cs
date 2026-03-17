namespace Platzwart.Bookings;

public record BookingRequest(
    string Title,
    string BookingType,
    int? TeamId,
    DateTime StartTime,
    DateTime EndTime,
    List<int> SectionIds,
    string? Notes,
    string? RRule
);

public static class BookingValidation
{
    public static string? Validate(BookingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return "Titel ist erforderlich";
        if (request.StartTime >= request.EndTime)
            return "Startzeit muss vor Endzeit liegen";
        if (request.EndTime - request.StartTime > TimeSpan.FromHours(12))
            return "Buchung darf maximal 12 Stunden dauern";
        if (request.SectionIds.Count == 0)
            return "Mindestens eine Sektion muss gewaehlt werden";
        if (!Enum.TryParse<BookingType>(request.BookingType, true, out _))
            return "Ungueltiger Buchungstyp";
        return null;
    }
}
