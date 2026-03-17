using Microsoft.EntityFrameworkCore;
using Platzwart.Auth;
using Platzwart.Bookings;
using Platzwart.Fields;
using Platzwart.Teams;
using Platzwart.Users;

namespace Platzwart.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Team> Teams => Set<Team>();
    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
    public DbSet<Field> Fields => Set<Field>();
    public DbSet<FieldSection> FieldSections => Set<FieldSection>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingSection> BookingSections => Set<BookingSection>();
    public DbSet<RecurrenceRule> RecurrenceRules => Set<RecurrenceRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<Session>(e =>
        {
            e.ToTable("sessions");
            e.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId);
        });

        modelBuilder.Entity<Team>(e =>
        {
            e.ToTable("teams");
        });

        modelBuilder.Entity<TeamMember>(e =>
        {
            e.ToTable("team_members");
            e.HasKey(tm => new { tm.TeamId, tm.UserId });
            e.HasOne(tm => tm.Team).WithMany(t => t.Members).HasForeignKey(tm => tm.TeamId);
            e.HasOne(tm => tm.User).WithMany().HasForeignKey(tm => tm.UserId);
        });

        modelBuilder.Entity<Field>(e =>
        {
            e.ToTable("fields");
        });

        modelBuilder.Entity<FieldSection>(e =>
        {
            e.ToTable("field_sections");
            e.HasOne(fs => fs.Field).WithMany(f => f.Sections).HasForeignKey(fs => fs.FieldId);
            e.HasIndex(fs => new { fs.FieldId, fs.ColIndex, fs.RowIndex }).IsUnique();
        });

        modelBuilder.Entity<Booking>(e =>
        {
            e.ToTable("bookings");
            e.HasOne(b => b.Team).WithMany().HasForeignKey(b => b.TeamId);
            e.HasOne(b => b.BookedBy).WithMany().HasForeignKey(b => b.BookedById);
            e.HasOne(b => b.Recurrence).WithMany(r => r.Bookings).HasForeignKey(b => b.RecurrenceId);
            e.Property(b => b.BookingType).HasConversion<string>();
        });

        modelBuilder.Entity<BookingSection>(e =>
        {
            e.ToTable("booking_sections");
            e.HasKey(bs => new { bs.BookingId, bs.SectionId });
            e.HasOne(bs => bs.Booking).WithMany(b => b.BookingSections).HasForeignKey(bs => bs.BookingId);
            e.HasOne(bs => bs.Section).WithMany().HasForeignKey(bs => bs.SectionId);
        });

        modelBuilder.Entity<RecurrenceRule>(e =>
        {
            e.ToTable("recurrence_rules");
            e.HasOne(r => r.CreatedBy).WithMany().HasForeignKey(r => r.CreatedById);
        });
    }
}
