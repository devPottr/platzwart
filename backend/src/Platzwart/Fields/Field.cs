namespace Platzwart.Fields;

public class Field
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int GridCols { get; set; } = 2;
    public int GridRows { get; set; } = 2;
    public int SortOrder { get; set; }
    public List<FieldSection> Sections { get; set; } = [];
}

public class FieldSection
{
    public int Id { get; set; }
    public int FieldId { get; set; }
    public Field Field { get; set; } = null!;
    public int ColIndex { get; set; }
    public int RowIndex { get; set; }
    public string? Label { get; set; }
}
