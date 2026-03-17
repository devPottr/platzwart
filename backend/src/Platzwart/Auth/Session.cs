using Platzwart.Users;

namespace Platzwart.Auth;

public class Session
{
    public required string Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
