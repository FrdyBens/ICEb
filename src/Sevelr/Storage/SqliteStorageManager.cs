using System.Data;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Sevelr.Configuration.Models;
using Sevelr.Core;
using Sevelr.Logging;

namespace Sevelr.Storage;

public class SqliteStorageManager : IDisposable
{
    private readonly string _connectionString;
    private readonly string _dbPath;

    public SqliteStorageManager(string? dbPath = null)
    {
        _dbPath = dbPath ?? Constants.Paths.DatabasePath;
        var dir = Path.GetDirectoryName(_dbPath);
        if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
        {
            Directory.CreateDirectory(dir);
        }

        _connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = _dbPath,
            Mode = SqliteOpenMode.ReadWriteCreate,
            Cache = SqliteCacheMode.Shared
        }.ToString();

        InitializeDatabase();
    }

    private void InitializeDatabase()
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;

            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                description TEXT,
                template TEXT NOT NULL DEFAULT 'strict',
                schema_version INTEGER NOT NULL DEFAULT 2,
                config_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_archived INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS runtime_sessions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                process_id INTEGER,
                is_running INTEGER NOT NULL DEFAULT 0,
                started_at TEXT NOT NULL,
                stopped_at TEXT,
                metrics_json TEXT
            );

            CREATE TABLE IF NOT EXISTS audit_events (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                severity TEXT NOT NULL,
                component TEXT NOT NULL,
                project_id TEXT,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details_json TEXT
            );

            CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                snapshot_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                checksum TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                manifest_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_events(project_id);
            CREATE INDEX IF NOT EXISTS idx_snapshots_project ON snapshots(project_id);
        ";
        cmd.ExecuteNonQuery();
    }

    public void SaveProject(ProjectConfig config)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO projects (id, display_name, description, template, schema_version, config_json, created_at, updated_at)
            VALUES ($id, $name, $desc, $template, $schema, $config, $created, $updated)
            ON CONFLICT(id) DO UPDATE SET
                display_name = excluded.display_name,
                description = excluded.description,
                template = excluded.template,
                schema_version = excluded.schema_version,
                config_json = excluded.config_json,
                updated_at = excluded.updated_at;
        ";

        cmd.Parameters.AddWithValue("$id", config.Project.Id);
        cmd.Parameters.AddWithValue("$name", config.Project.DisplayName);
        cmd.Parameters.AddWithValue("$desc", (object?)config.Project.Description ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$template", config.Project.Template);
        cmd.Parameters.AddWithValue("$schema", config.SchemaVersion);
        cmd.Parameters.AddWithValue("$config", JsonSerializer.Serialize(config));
        cmd.Parameters.AddWithValue("$created", config.Project.CreatedAt.ToString("o"));
        cmd.Parameters.AddWithValue("$updated", DateTime.UtcNow.ToString("o"));

        cmd.ExecuteNonQuery();
    }

    public ProjectConfig? GetProject(string id)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT config_json FROM projects WHERE id = $id;";
        cmd.Parameters.AddWithValue("$id", id);

        var json = cmd.ExecuteScalar() as string;
        return string.IsNullOrEmpty(json) ? null : JsonSerializer.Deserialize<ProjectConfig>(json);
    }

    public List<ProjectConfig> GetAllProjects()
    {
        var list = new List<ProjectConfig>();
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = "SELECT config_json FROM projects WHERE is_archived = 0 ORDER BY updated_at DESC;";

        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            var json = reader.GetString(0);
            var item = JsonSerializer.Deserialize<ProjectConfig>(json);
            if (item != null) list.Add(item);
        }

        return list;
    }

    public bool DeleteProject(string id)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = "DELETE FROM projects WHERE id = $id;";
        cmd.Parameters.AddWithValue("$id", id);

        return cmd.ExecuteNonQuery() > 0;
    }

    public void LogEvent(AuditEvent evt)
    {
        using var connection = new SqliteConnection(_connectionString);
        connection.Open();

        using var cmd = connection.CreateCommand();
        cmd.CommandText = @"
            INSERT INTO audit_events (id, timestamp, severity, component, project_id, event_type, message, details_json)
            VALUES ($id, $ts, $sev, $comp, $proj, $type, $msg, $det);
        ";

        cmd.Parameters.AddWithValue("$id", evt.EventId ?? Guid.NewGuid().ToString());
        cmd.Parameters.AddWithValue("$ts", evt.Timestamp.ToString("o"));
        cmd.Parameters.AddWithValue("$sev", evt.Severity.ToString());
        cmd.Parameters.AddWithValue("$comp", evt.Component ?? "Agent");
        cmd.Parameters.AddWithValue("$proj", (object?)evt.ProjectId ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$type", evt.Action ?? "Action");
        cmd.Parameters.AddWithValue("$msg", evt.Details ?? "");
        cmd.Parameters.AddWithValue("$det", evt.Metadata != null ? JsonSerializer.Serialize(evt.Metadata) : DBNull.Value);

        cmd.ExecuteNonQuery();
    }

    public void Dispose()
    {
        // SqliteConnection pooling cleans up gracefully
    }
}
