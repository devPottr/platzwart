using Platzwart.Auth;
using Xunit;

namespace Platzwart.Tests;

public class AuthTests
{
    [Fact]
    public void PasswordHasher_ShouldHashAndVerify()
    {
        var password = "TestPasswort123!";
        var hash = PasswordHasher.Hash(password);

        Assert.NotEqual(password, hash);
        Assert.True(PasswordHasher.Verify(password, hash));
    }

    [Fact]
    public void PasswordHasher_ShouldRejectWrongPassword()
    {
        var hash = PasswordHasher.Hash("Richtig123!");

        Assert.False(PasswordHasher.Verify("Falsch456!", hash));
    }

    [Fact]
    public void PasswordHasher_ShouldGenerateUniqueHashes()
    {
        var password = "SamePassword123!";
        var hash1 = PasswordHasher.Hash(password);
        var hash2 = PasswordHasher.Hash(password);

        Assert.NotEqual(hash1, hash2);
        Assert.True(PasswordHasher.Verify(password, hash1));
        Assert.True(PasswordHasher.Verify(password, hash2));
    }
}
