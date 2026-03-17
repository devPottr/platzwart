using Microsoft.EntityFrameworkCore;
using Platzwart.Data;

namespace Platzwart.Fields;

public class FieldService(AppDbContext db)
{
    public async Task<List<Field>> GetAllAsync() =>
        await db.Fields
            .Include(f => f.Sections)
            .OrderBy(f => f.SortOrder)
            .ToListAsync();

    public async Task<Field?> GetByIdAsync(int id) =>
        await db.Fields
            .Include(f => f.Sections)
            .FirstOrDefaultAsync(f => f.Id == id);

    public async Task<Field> CreateAsync(string name, int gridCols, int gridRows)
    {
        var maxOrder = await db.Fields.MaxAsync(f => (int?)f.SortOrder) ?? 0;
        var field = new Field
        {
            Name = name,
            GridCols = gridCols,
            GridRows = gridRows,
            SortOrder = maxOrder + 1
        };
        db.Fields.Add(field);
        await db.SaveChangesAsync();

        await RegenerateSections(field);
        return field;
    }

    public async Task<Field?> UpdateGridAsync(int id, int gridCols, int gridRows)
    {
        var field = await db.Fields.Include(f => f.Sections).FirstOrDefaultAsync(f => f.Id == id);
        if (field is null) return null;

        field.GridCols = gridCols;
        field.GridRows = gridRows;
        await db.SaveChangesAsync();

        await RegenerateSections(field);
        return field;
    }

    private async Task RegenerateSections(Field field)
    {
        // Remove sections that are outside the new grid
        var toRemove = field.Sections
            .Where(s => s.ColIndex >= field.GridCols || s.RowIndex >= field.GridRows)
            .ToList();
        db.FieldSections.RemoveRange(toRemove);

        // Add missing sections
        for (var row = 0; row < field.GridRows; row++)
        {
            for (var col = 0; col < field.GridCols; col++)
            {
                if (!field.Sections.Any(s => s.ColIndex == col && s.RowIndex == row))
                {
                    db.FieldSections.Add(new FieldSection
                    {
                        FieldId = field.Id,
                        ColIndex = col,
                        RowIndex = row
                    });
                }
            }
        }

        await db.SaveChangesAsync();
        // Reload sections
        field.Sections = await db.FieldSections.Where(s => s.FieldId == field.Id).ToListAsync();
    }
}
