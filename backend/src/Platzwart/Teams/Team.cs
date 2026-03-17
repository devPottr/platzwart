using Platzwart.Users;

namespace Platzwart.Teams;

public class Team
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Color { get; set; }
    public int SortOrder { get; set; }
    public List<TeamMember> Members { get; set; } = [];
}

public class TeamMember
{
    public int TeamId { get; set; }
    public Team Team { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public bool IsLead { get; set; }
}
