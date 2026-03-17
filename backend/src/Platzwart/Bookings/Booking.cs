using Platzwart.Fields;
using Platzwart.Teams;
using Platzwart.Users;

namespace Platzwart.Bookings;

public enum BookingType
{
    Training,
    Match,
    Tournament,
    Maintenance,
    Locked
}

public class Booking
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public BookingType BookingType { get; set; } = BookingType.Training;
    public int? TeamId { get; set; }
    public Team? Team { get; set; }
    public int BookedById { get; set; }
    public User BookedBy { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Notes { get; set; }
    public int? RecurrenceId { get; set; }
    public RecurrenceRule? Recurrence { get; set; }
    public List<BookingSection> BookingSections { get; set; } = [];
}

public class BookingSection
{
    public int BookingId { get; set; }
    public Booking Booking { get; set; } = null!;
    public int SectionId { get; set; }
    public FieldSection Section { get; set; } = null!;
}

public class RecurrenceRule
{
    public int Id { get; set; }
    public required string RRule { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public List<Booking> Bookings { get; set; } = [];
}
