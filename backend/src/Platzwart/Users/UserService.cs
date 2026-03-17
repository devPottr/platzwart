using Microsoft.EntityFrameworkCore;
using Platzwart.Data;

namespace Platzwart.Users;

public class UserService(AppDbContext db)
{
    public async Task<List<User>> GetAllAsync() =>
        await db.Users.OrderBy(u => u.DisplayName).ToListAsync();

    public async Task<User?> GetByIdAsync(int id) =>
        await db.Users.FindAsync(id);

    public async Task<User?> UpdateRoleAsync(int id, UserRole role)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return null;
        user.Role = role;
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<User?> SetActiveAsync(int id, bool isActive)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return null;
        user.IsActive = isActive;
        await db.SaveChangesAsync();
        return user;
    }
}
