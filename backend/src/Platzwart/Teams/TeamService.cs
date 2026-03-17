using Microsoft.EntityFrameworkCore;
using Platzwart.Data;

namespace Platzwart.Teams;

public class TeamService(AppDbContext db)
{
    public async Task<List<Team>> GetAllAsync() =>
        await db.Teams
            .Include(t => t.Members).ThenInclude(m => m.User)
            .OrderBy(t => t.SortOrder)
            .ToListAsync();

    public async Task<Team?> GetByIdAsync(int id) =>
        await db.Teams
            .Include(t => t.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Team> CreateAsync(string name, string color)
    {
        var maxOrder = await db.Teams.MaxAsync(t => (int?)t.SortOrder) ?? 0;
        var team = new Team { Name = name, Color = color, SortOrder = maxOrder + 1 };
        db.Teams.Add(team);
        await db.SaveChangesAsync();
        return team;
    }

    public async Task<Team?> UpdateAsync(int id, string name, string color)
    {
        var team = await db.Teams.FindAsync(id);
        if (team is null) return null;
        team.Name = name;
        team.Color = color;
        await db.SaveChangesAsync();
        return team;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var team = await db.Teams.FindAsync(id);
        if (team is null) return false;
        db.Teams.Remove(team);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AddMemberAsync(int teamId, int userId, bool isLead)
    {
        if (await db.TeamMembers.AnyAsync(m => m.TeamId == teamId && m.UserId == userId))
            return false;
        db.TeamMembers.Add(new TeamMember { TeamId = teamId, UserId = userId, IsLead = isLead });
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveMemberAsync(int teamId, int userId)
    {
        var member = await db.TeamMembers.FindAsync(teamId, userId);
        if (member is null) return false;
        db.TeamMembers.Remove(member);
        await db.SaveChangesAsync();
        return true;
    }
}
