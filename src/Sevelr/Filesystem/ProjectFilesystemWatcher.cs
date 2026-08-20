using System.Collections.Concurrent;
using Sevelr.Logging;

namespace Sevelr.Filesystem;

public class ProjectFilesystemWatcher : IDisposable
{
    private readonly string _projectId;
    private readonly string _watchPath;
    private readonly IAuditLogger _logger;
    private FileSystemWatcher? _watcher;
    private readonly ConcurrentDictionary<string, (WatcherChangeTypes ChangeType, DateTime Timestamp, string? OldPath)> _pendingEvents = new();
    private readonly Timer _debounceTimer;
    private bool _disposed;

    public event Action<string, string, string>? FileChangedEvent; // (projectId, eventType, relativePath)

    public ProjectFilesystemWatcher(string projectId, string watchPath, IAuditLogger logger)
    {
        _projectId = projectId;
        _watchPath = watchPath;
        _logger = logger;
        _debounceTimer = new Timer(FlushPendingEvents, null, Timeout.Infinite, Timeout.Infinite);

        if (Directory.Exists(watchPath))
        {
            StartWatching();
        }
    }

    private void StartWatching()
    {
        try
        {
            _watcher = new FileSystemWatcher(_watchPath)
            {
                IncludeSubdirectories = true,
                NotifyFilter = NotifyFilters.FileName | NotifyFilters.DirectoryName |
                               NotifyFilters.LastWrite | NotifyFilters.Size | NotifyFilters.CreationTime
            };

            _watcher.Created += OnChanged;
            _watcher.Changed += OnChanged;
            _watcher.Deleted += OnChanged;
            _watcher.Renamed += OnRenamed;
            _watcher.EnableRaisingEvents = true;

            _logger.Log(new AuditEvent
            {
                Severity = LogSeverity.Info,
                Component = "FilesystemWatcher",
                ProjectId = _projectId,
                Action = "watcher.started",
                Details = $"Real-time monitoring active for '{_watchPath}'"
            });
        }
        catch (Exception ex)
        {
            _logger.Log(new AuditEvent
            {
                Severity = LogSeverity.Warning,
                Component = "FilesystemWatcher",
                ProjectId = _projectId,
                Action = "watcher.failed",
                Details = $"Failed to start filesystem watcher for '{_watchPath}': {ex.Message}"
            });
        }
    }

    private void OnChanged(object sender, FileSystemEventArgs e)
    {
        var relative = Path.GetRelativePath(_watchPath, e.FullPath);
        _pendingEvents[relative] = (e.ChangeType, DateTime.UtcNow, null);
        _debounceTimer.Change(200, Timeout.Infinite);
    }

    private void OnRenamed(object sender, RenamedEventArgs e)
    {
        var relative = Path.GetRelativePath(_watchPath, e.FullPath);
        var oldRelative = Path.GetRelativePath(_watchPath, e.OldFullPath);
        _pendingEvents[relative] = (WatcherChangeTypes.Renamed, DateTime.UtcNow, oldRelative);
        _debounceTimer.Change(200, Timeout.Infinite);
    }

    private void FlushPendingEvents(object? state)
    {
        if (_disposed) return;

        var entries = _pendingEvents.ToArray();
        _pendingEvents.Clear();

        foreach (var entry in entries)
        {
            var relativePath = entry.Key;
            var (changeType, _, oldPath) = entry.Value;
            var eventType = changeType switch
            {
                WatcherChangeTypes.Created => "file.created",
                WatcherChangeTypes.Deleted => "file.deleted",
                WatcherChangeTypes.Renamed => "file.renamed",
                _ => "file.modified"
            };

            _logger.Log(new AuditEvent
            {
                Severity = LogSeverity.Info,
                Component = "FilesystemWatcher",
                ProjectId = _projectId,
                Action = eventType,
                Details = eventType == "file.renamed"
                    ? $"Renamed '{oldPath}' to '{relativePath}'"
                    : $"File '{relativePath}' was {changeType.ToString().ToLower()}",
                Metadata = new Dictionary<string, object>
                {
                    ["path"] = relativePath,
                    ["eventType"] = eventType,
                    ["oldPath"] = oldPath ?? ""
                }
            });

            FileChangedEvent?.Invoke(_projectId, eventType, relativePath);
        }
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _debounceTimer.Dispose();
        if (_watcher != null)
        {
            _watcher.EnableRaisingEvents = false;
            _watcher.Dispose();
        }
    }
}
