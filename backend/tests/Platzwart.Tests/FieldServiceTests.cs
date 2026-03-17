using Microsoft.EntityFrameworkCore;
using Platzwart.Data;
using Platzwart.Fields;
using Xunit;

namespace Platzwart.Tests;

public class FieldServiceTests
{
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateField_ShouldGenerateSections()
    {
        var db = CreateDb();
        var service = new FieldService(db);

        var field = await service.CreateAsync("Platz 1", 2, 3);

        Assert.Equal("Platz 1", field.Name);
        Assert.Equal(2, field.GridCols);
        Assert.Equal(3, field.GridRows);
        Assert.Equal(6, field.Sections.Count);
    }

    [Fact]
    public async Task UpdateGrid_ShouldRegenerateSections()
    {
        var db = CreateDb();
        var service = new FieldService(db);

        var field = await service.CreateAsync("Platz 1", 2, 2);
        Assert.Equal(4, field.Sections.Count);

        var updated = await service.UpdateGridAsync(field.Id, 3, 3);

        Assert.NotNull(updated);
        Assert.Equal(9, updated!.Sections.Count);
    }

    [Fact]
    public async Task UpdateGrid_ShouldShrinkSections()
    {
        var db = CreateDb();
        var service = new FieldService(db);

        var field = await service.CreateAsync("Platz 1", 3, 3);
        Assert.Equal(9, field.Sections.Count);

        var updated = await service.UpdateGridAsync(field.Id, 1, 1);

        Assert.NotNull(updated);
        Assert.Single(updated!.Sections);
    }
}
