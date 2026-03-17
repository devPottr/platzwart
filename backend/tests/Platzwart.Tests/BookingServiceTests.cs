using Microsoft.EntityFrameworkCore;
using Platzwart.Auth;
using Platzwart.Bookings;
using Platzwart.Data;
using Platzwart.Fields;
using Platzwart.Users;
using Xunit;

namespace Platzwart.Tests;

public class BookingServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static async Task<(AppDbContext db, User user, FieldSection section)> SeedAsync()
    {
        var db = CreateDb();
        var user = new User { Email = "test@test.de", PasswordHash = PasswordHasher.Hash("test1234"), DisplayName = "Test" };
        db.Users.Add(user);
        var field = new Field { Name = "Platz 1", GridCols = 2, GridRows = 2 };
        db.Fields.Add(field);
        await db.SaveChangesAsync();
        var section = new FieldSection { FieldId = field.Id, ColIndex = 0, RowIndex = 0 };
        db.FieldSections.Add(section);
        await db.SaveChangesAsync();
        return (db, user, section);
    }

    [Fact]
    public async Task CreateBooking_ShouldSucceed()
    {
        var (db, user, section) = await SeedAsync();
        var service = new BookingService(db);

        var request = new BookingRequest(
            "Training", "Training", null,
            DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2),
            [section.Id], null, null);

        var booking = await service.CreateAsync(request, user.Id);

        Assert.NotNull(booking);
        Assert.Equal("Training", booking.Title);
        Assert.Single(booking.BookingSections);
    }

    [Fact]
    public async Task FindConflicts_ShouldDetectOverlap()
    {
        var (db, user, section) = await SeedAsync();
        var service = new BookingService(db);

        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(2);

        await service.CreateAsync(new BookingRequest(
            "Existing", "Training", null, start, end, [section.Id], null, null), user.Id);

        var conflicts = await service.FindConflictsAsync(
            start.AddMinutes(30), end.AddMinutes(30), [section.Id]);

        Assert.Single(conflicts);
        Assert.Equal(section.Id, conflicts[0]);
    }

    [Fact]
    public async Task FindConflicts_ShouldNotDetectNonOverlap()
    {
        var (db, user, section) = await SeedAsync();
        var service = new BookingService(db);

        var start = DateTime.UtcNow.AddHours(1);
        var end = DateTime.UtcNow.AddHours(2);

        await service.CreateAsync(new BookingRequest(
            "Existing", "Training", null, start, end, [section.Id], null, null), user.Id);

        var conflicts = await service.FindConflictsAsync(
            end.AddMinutes(1), end.AddHours(1), [section.Id]);

        Assert.Empty(conflicts);
    }

    [Fact]
    public async Task DeleteBooking_ShouldRemove()
    {
        var (db, user, section) = await SeedAsync();
        var service = new BookingService(db);

        var booking = await service.CreateAsync(new BookingRequest(
            "ToDelete", "Training", null,
            DateTime.UtcNow.AddHours(1), DateTime.UtcNow.AddHours(2),
            [section.Id], null, null), user.Id);

        var result = await service.DeleteAsync(booking.Id);

        Assert.True(result);
        Assert.Null(await service.GetByIdAsync(booking.Id));
    }
}
