using System.Security;
using Sevelr.Filesystem;
using Xunit;

namespace Sevelr.Tests;

public class PathSecurityTests
{
    private readonly string _testBaseDir;

    public PathSecurityTests()
    {
        _testBaseDir = Path.Combine(Path.GetTempPath(), "Sevelr_Test_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_testBaseDir);
    }

    [Fact]
    public void ResolveSafePath_ValidRelativePath_Succeeds()
    {
        var resolved = PathSecurity.ResolveSafePath(_testBaseDir, "subfolder/config.json");
        var expected = Path.GetFullPath(Path.Combine(_testBaseDir, "subfolder", "config.json"));
        Assert.Equal(expected, resolved);
    }

    [Theory]
    [InlineData("../secret.txt")]
    [InlineData("..\\..\\Windows\\System32\\cmd.exe")]
    [InlineData("subfolder/../../secret.txt")]
    [InlineData("/etc/passwd")]
    [InlineData("C:\\Windows\\notepad.exe")]
    [InlineData("\\\\evil-server\\share\\exploit.dll")]
    public void ResolveSafePath_TraversalAttempt_ThrowsSecurityException(string maliciousPath)
    {
        Assert.Throws<SecurityException>(() =>
        {
            PathSecurity.ResolveSafePath(_testBaseDir, maliciousPath);
        });
    }

    [Theory]
    [InlineData("file.txt:hidden_stream")]
    [InlineData("data::$DATA")]
    public void ResolveSafePath_AlternateDataStream_ThrowsSecurityException(string adsPath)
    {
        Assert.Throws<SecurityException>(() =>
        {
            PathSecurity.ResolveSafePath(_testBaseDir, adsPath);
        });
    }

    [Fact]
    public void IsPathSafe_ReturnsFalseForDangerousPaths()
    {
        bool isSafe = PathSecurity.IsPathSafe(_testBaseDir, "../escape.txt", out var fullPath);
        Assert.False(isSafe);
        Assert.Empty(fullPath);
    }
}
