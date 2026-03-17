namespace Platzwart.Users;

public enum UserRole
{
    Member,
    Trainer,
    Platzwart,
    Admin
}

public class User
{
    public int Id { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string DisplayName { get; set; }
    public UserRole Role { get; set; } = UserRole.Member;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
