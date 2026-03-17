using Microsoft.EntityFrameworkCore;
using Platzwart.Data;
using Platzwart.Fields;

namespace Platzwart.Bookings;

public class BookingService(AppDbContext db)
{
    public async Task<List<Booking>> GetByFieldAndWeekAsync(int fieldId, DateOnly weekStart)
    {
        var start = weekStart.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var end = start.AddDays(7);

        var sectionIds = await db.FieldSections
            .Where(s => s.FieldId == fieldId)
            .Select(s => s.Id)
            .ToListAsync();

        return await db.Bookings
            .Include(b => b.Team)
            .Include(b => b.BookedBy)
            .Include(b => b.BookingSections).ThenInclude(bs => bs.Section)
            .Where(b => b.StartTime < end && b.EndTime > start)
            .Where(b => b.BookingSections.Any(bs => sectionIds.Contains(bs.SectionId)))
            .OrderBy(b => b.StartTime)
            .ToListAsync();
    }

    public async Task<Booking?> GetByIdAsync(int id) =>
        await db.Bookings
            .Include(b => b.Team)
            .Include(b => b.BookedBy)
            .Include(b => b.BookingSections).ThenInclude(bs => bs.Section)
            .FirstOrDefaultAsync(b => b.Id == id);

    public async Task<List<int>> FindConflictsAsync(DateTime startTime, DateTime endTime, List<int> sectionIds, int? excludeBookingId = null)
    {
        var query = db.BookingSections
            .Where(bs => sectionIds.Contains(bs.SectionId))
            .Where(bs => bs.Booking.StartTime < endTime && bs.Booking.EndTime > startTime);

        if (excludeBookingId.HasValue)
            query = query.Where(bs => bs.BookingId != excludeBookingId.Value);

        return await query.Select(bs => bs.SectionId).Distinct().ToListAsync();
    }

    public async Task<Booking> CreateAsync(BookingRequest request, int bookedById)
    {
        var booking = new Booking
        {
            Title = request.Title.Trim(),
            BookingType = Enum.Parse<BookingType>(request.BookingType, true),
            TeamId = request.TeamId,
            BookedById = bookedById,
            StartTime = request.StartTime.ToUniversalTime(),
            EndTime = request.EndTime.ToUniversalTime(),
            Notes = request.Notes?.Trim()
        };

        if (!string.IsNullOrWhiteSpace(request.RRule))
        {
            var recurrence = new RecurrenceRule
            {
                RRule = request.RRule,
                CreatedById = bookedById
            };
            db.RecurrenceRules.Add(recurrence);
            await db.SaveChangesAsync();
            booking.RecurrenceId = recurrence.Id;
        }

        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        foreach (var sectionId in request.SectionIds)
        {
            db.BookingSections.Add(new BookingSection
            {
                BookingId = booking.Id,
                SectionId = sectionId
            });
        }
        await db.SaveChangesAsync();

        return (await GetByIdAsync(booking.Id))!;
    }

    public async Task<Booking?> UpdateAsync(int id, BookingRequest request)
    {
        var booking = await db.Bookings.Include(b => b.BookingSections).FirstOrDefaultAsync(b => b.Id == id);
        if (booking is null) return null;

        booking.Title = request.Title.Trim();
        booking.BookingType = Enum.Parse<BookingType>(request.BookingType, true);
        booking.TeamId = request.TeamId;
        booking.StartTime = request.StartTime.ToUniversalTime();
        booking.EndTime = request.EndTime.ToUniversalTime();
        booking.Notes = request.Notes?.Trim();

        db.BookingSections.RemoveRange(booking.BookingSections);
        foreach (var sectionId in request.SectionIds)
        {
            db.BookingSections.Add(new BookingSection { BookingId = id, SectionId = sectionId });
        }

        await db.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var booking = await db.Bookings.FindAsync(id);
        if (booking is null) return false;
        db.Bookings.Remove(booking);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<int> DeleteSeriesAsync(int recurrenceId)
    {
        var bookings = await db.Bookings.Where(b => b.RecurrenceId == recurrenceId).ToListAsync();
        db.Bookings.RemoveRange(bookings);
        var rule = await db.RecurrenceRules.FindAsync(recurrenceId);
        if (rule is not null) db.RecurrenceRules.Remove(rule);
        await db.SaveChangesAsync();
        return bookings.Count;
    }
}
