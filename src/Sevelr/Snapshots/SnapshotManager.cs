using System.IO.Compression;
using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using Sevelr.Configuration.Models;
using Sevelr.Core;
using Sevelr.Filesystem;
using Sevelr.Logging;
using Sevelr.Storage;

namespace Sevelr.Snapshots;

public class SnapshotManifest
{
    [JsonPropertyName("manifestVersion")]
    public int ManifestVersion { get; set; } = 1;

    [JsonPropertyName("schemaVersion")]
    public int SchemaVersion { get; set; } = Constants.CurrentSchemaVersion;

    [JsonPropertyName("platformVersion")]
    public string PlatformVersion { get; set; } = Constants.PlatformVersion;

    [JsonPropertyName("projectId")]
    public string ProjectId { get; set; } = string.Empty;

    [JsonPropertyName("snapshotName")]
    public string SnapshotName { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("files")]
    public Dictionary<string, string> FileChecksums { get; set; } = [];
}

public class RestorePreviewResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public SnapshotManifest? Manifest { get; set; }
    public List<string> FilesToCreate { get; set; } = [];
    public List<string> FilesToOverwrite { get; set; } = [];
    public List<string> FilesToDelete { get; set; } = [];
}

public class SnapshotManager
{
    private readonly IStorageManager _storage;
    private readonly SqliteStorageManager _sqlite;
    private readonly IAuditLogger _logger;

    public SnapshotManager(IStorageManager storage, SqliteStorageManager sqlite, IAuditLogger logger)
    {
        _storage = storage;
        _sqlite = sqlite;
        _logger = logger;

        if (!Directory.Exists(Constants.Paths.SnapshotsDir))
        {
            Directory.CreateDirectory(Constants.Paths.SnapshotsDir);
        }
    }

    public string CreateSnapshot(string projectId, string? customName = null, bool includeFiles = true)
    {
        var config = _sqlite.GetProject(projectId) 
            ?? throw new ConfigurationException($"Project '{projectId}' not found.");

        var paths = _storage.GetProjectPaths(projectId);
        var timestampStr = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        var name = string.IsNullOrWhiteSpace(customName) ? $"{projectId}_{timestampStr}" : customName.Trim();
        var safeFileName = $"{name}.sevelr";
        var snapshotFilePath = Path.Combine(Constants.Paths.SnapshotsDir, safeFileName);

        var manifest = new SnapshotManifest
        {
            ProjectId = projectId,
            SnapshotName = name,
            CreatedAt = DateTime.UtcNow,
            SchemaVersion = config.SchemaVersion
        };

        if (File.Exists(snapshotFilePath))
        {
            File.Delete(snapshotFilePath);
        }

        using (var zip = ZipFile.Open(snapshotFilePath, ZipArchiveMode.Create))
        {
            // 1. Store config.json
            var configJson = JsonSerializer.Serialize(config, new JsonSerializerOptions { WriteIndented = true });
            var configEntry = zip.CreateEntry("config.json");
            using (var writer = new StreamWriter(configEntry.Open()))
            {
                writer.Write(configJson);
            }

            // 2. Store project files if directory exists and requested
            if (includeFiles && Directory.Exists(paths.Root))
            {
                var files = Directory.GetFiles(paths.Root, "*", SearchOption.AllDirectories);
                foreach (var file in files)
                {
                    var rel = Path.GetRelativePath(paths.Root, file).Replace('\\', '/');
                    // Skip lock files and active log files
                    if (rel.EndsWith(".lock") || rel.StartsWith("logs/")) continue;

                    using var fs = File.OpenRead(file);
                    using var sha = SHA256.Create();
                    var hashBytes = sha.ComputeHash(fs);
                    manifest.FileChecksums[rel] = Convert.ToHexString(hashBytes).ToLowerInvariant();

                    zip.CreateEntryFromFile(file, $"data/{rel}", CompressionLevel.Optimal);
                }
            }

            // 3. Store manifest.json
            var manifestJson = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
            var manifestEntry = zip.CreateEntry("manifest.json");
            using (var writer = new StreamWriter(manifestEntry.Open()))
            {
                writer.Write(manifestJson);
            }
        }

        _logger.Log(new AuditEvent
        {
            Severity = LogSeverity.Info,
            Component = "SnapshotManager",
            ProjectId = projectId,
            Action = "snapshot.created",
            Details = $"Snapshot '{name}' created ({new FileInfo(snapshotFilePath).Length} bytes)"
        });

        return snapshotFilePath;
    }

    public RestorePreviewResult PreviewRestore(string snapshotFilePath)
    {
        var result = new RestorePreviewResult();
        if (!File.Exists(snapshotFilePath))
        {
            result.IsValid = false;
            result.ErrorMessage = "Snapshot file does not exist.";
            return result;
        }

        try
        {
            using var zip = ZipFile.OpenRead(snapshotFilePath);
            var manifestEntry = zip.GetEntry("manifest.json");
            if (manifestEntry == null)
            {
                result.IsValid = false;
                result.ErrorMessage = "Corrupt snapshot: manifest.json is missing.";
                return result;
            }

            using var reader = new StreamReader(manifestEntry.Open());
            var manifest = JsonSerializer.Deserialize<SnapshotManifest>(reader.ReadToEnd());
            result.Manifest = manifest;
            result.IsValid = true;

            if (manifest != null)
            {
                var paths = _storage.GetProjectPaths(manifest.ProjectId);
                foreach (var entry in zip.Entries)
                {
                    if (entry.FullName.StartsWith("data/"))
                    {
                        var rel = entry.FullName["data/".Length..];
                        var targetFile = Path.Combine(paths.Root, rel);
                        if (File.Exists(targetFile))
                            result.FilesToOverwrite.Add(rel);
                        else
                            result.FilesToCreate.Add(rel);
                    }
                }
            }

            return result;
        }
        catch (Exception ex)
        {
            result.IsValid = false;
            result.ErrorMessage = $"Error reading snapshot: {ex.Message}";
            return result;
        }
    }

    public bool RestoreSnapshot(string snapshotFilePath)
    {
        var preview = PreviewRestore(snapshotFilePath);
        if (!preview.IsValid || preview.Manifest == null)
        {
            throw new SecurityException($"Invalid snapshot file: {preview.ErrorMessage}");
        }

        var projectId = preview.Manifest.ProjectId;
        var paths = _storage.GetProjectPaths(projectId);

        using var zip = ZipFile.OpenRead(snapshotFilePath);
        
        // 1. Restore config
        var configEntry = zip.GetEntry("config.json");
        if (configEntry != null)
        {
            using var reader = new StreamReader(configEntry.Open());
            var config = JsonSerializer.Deserialize<ProjectConfig>(reader.ReadToEnd());
            if (config != null)
            {
                _sqlite.SaveProject(config);
            }
        }

        // 2. Restore data files
        foreach (var entry in zip.Entries)
        {
            if (entry.FullName.StartsWith("data/") && !string.IsNullOrEmpty(entry.Name))
            {
                var rel = entry.FullName["data/".Length..];
                var targetPath = PathSecurity.ResolveSafePath(paths.Root, rel);
                var targetDir = Path.GetDirectoryName(targetPath);
                if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
                {
                    Directory.CreateDirectory(targetDir);
                }

                entry.ExtractToFile(targetPath, overwrite: true);
            }
        }

        _logger.Log(new AuditEvent
        {
            Severity = LogSeverity.Info,
            Component = "SnapshotManager",
            ProjectId = projectId,
            Action = "snapshot.restored",
            Details = $"Snapshot '{preview.Manifest.SnapshotName}' restored successfully."
        });

        return true;
    }
}
