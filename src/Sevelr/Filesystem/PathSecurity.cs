using System.Security;

namespace Sevelr.Filesystem;

public static class PathSecurity
{
    /// <summary>
    /// Validates and resolves a path relative to an authorized root directory.
    /// Strictly prevents path traversal, UNC paths, alternate data streams, and unauthorized access.
    /// </summary>
    /// <param name="baseDirectory">The trusted root directory for the project.</param>
    /// <param name="relativePath">The relative path requested by user/client.</param>
    /// <returns>The fully resolved safe canonical absolute path.</returns>
    /// <exception cref="SecurityException">Thrown when a security boundary violation is detected.</exception>
    public static string ResolveSafePath(string baseDirectory, string relativePath)
    {
        if (string.IsNullOrWhiteSpace(baseDirectory))
            throw new ArgumentException("Base directory cannot be null or empty.", nameof(baseDirectory));

        if (relativePath == null)
            throw new ArgumentNullException(nameof(relativePath));

        // Reject null bytes or dangerous control characters
        if (relativePath.IndexOf('\0') >= 0 || relativePath.IndexOfAny(Path.GetInvalidPathChars()) >= 0)
        {
            throw new SecurityException("Path contains invalid characters or null bytes.");
        }

        // Reject UNC paths or drive root prefixes in relativePath
        if (relativePath.StartsWith(@"\\") || relativePath.StartsWith("//") || (relativePath.Length >= 2 && relativePath[1] == ':'))
        {
            throw new SecurityException("Absolute drive paths and UNC network paths are forbidden.");
        }

        // Reject NTFS Alternate Data Streams (e.g. file.txt:stream or directory::$DATA)
        if (relativePath.Contains(':'))
        {
            throw new SecurityException("Alternate Data Streams (':') are prohibited.");
        }

        // Normalize separators
        string normalizedRelative = relativePath.Replace('/', Path.DirectorySeparatorChar)
                                                .Replace('\\', Path.DirectorySeparatorChar)
                                                .TrimStart(Path.DirectorySeparatorChar);

        // Canonical base directory
        string canonicalBase = Path.GetFullPath(baseDirectory);
        if (!canonicalBase.EndsWith(Path.DirectorySeparatorChar.ToString()))
        {
            canonicalBase += Path.DirectorySeparatorChar;
        }

        // Combine and canonicalize
        string combined = Path.Combine(canonicalBase, normalizedRelative);
        string canonicalTarget = Path.GetFullPath(combined);

        // Verify boundary containment
        if (!canonicalTarget.StartsWith(canonicalBase, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(canonicalTarget.TrimEnd(Path.DirectorySeparatorChar), canonicalBase.TrimEnd(Path.DirectorySeparatorChar), StringComparison.OrdinalIgnoreCase))
        {
            throw new SecurityException($"Path traversal attempt detected. Target '{relativePath}' escapes base directory '{baseDirectory}'.");
        }

        return canonicalTarget;
    }

    /// <summary>
    /// Checks if a file path is safe and strictly inside the project root without throwing.
    /// </summary>
    public static bool IsPathSafe(string baseDirectory, string relativePath, out string safeFullPath)
    {
        safeFullPath = string.Empty;
        try
        {
            safeFullPath = ResolveSafePath(baseDirectory, relativePath);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
