using System.Diagnostics;
using System.Drawing;
using System.Windows.Forms;
using Sevelr.Core;
using Sevelr.Logging;
using Sevelr.Projects;
using Sevelr.Storage;

namespace Sevelr.Tray;

public class TrayApplicationContext : ApplicationContext
{
    private readonly NotifyIcon _notifyIcon;
    private readonly ProjectManager _projectManager;
    private readonly SqliteStorageManager _sqlite;
    private readonly IAuditLogger _logger;
    private readonly int _serverPort;
    private bool _enforcementPaused = false;

    public TrayApplicationContext(
        ProjectManager projectManager,
        SqliteStorageManager sqlite,
        IAuditLogger logger,
        int serverPort = 3000)
    {
        _projectManager = projectManager;
        _sqlite = sqlite;
        _logger = logger;
        _serverPort = serverPort;

        _notifyIcon = new NotifyIcon
        {
            Icon = SystemIcons.Shield,
            Text = $"Sevelr - Active (Port {_serverPort})",
            Visible = true
        };

        _notifyIcon.DoubleClick += (s, e) => OpenDashboard();
        RebuildContextMenu();

        _notifyIcon.ShowBalloonTip(
            3000,
            "Sevelr Running",
            $"Sevelr agent is running in the system tray. Dashboard at http://localhost:{_serverPort}",
            ToolTipIcon.Info);
    }

    public void RebuildContextMenu()
    {
        var menu = new ContextMenuStrip();

        // 1. Open Dashboard
        var openItem = new ToolStripMenuItem("Open Dashboard", null, (s, e) => OpenDashboard())
        {
            Font = new Font(menu.Font, FontStyle.Bold)
        };
        menu.Items.Add(openItem);
        menu.Items.Add(new ToolStripSeparator());

        // 2. Projects Submenu
        var projectsMenu = new ToolStripMenuItem("Projects");
        var projects = _sqlite.GetAllProjects();
        if (projects.Count == 0)
        {
            projectsMenu.DropDownItems.Add(new ToolStripMenuItem("No projects created") { Enabled = false });
        }
        else
        {
            foreach (var proj in projects)
            {
                var projItem = new ToolStripMenuItem($"Launch {proj.Project.DisplayName}", null, async (s, e) =>
                {
                    try
                    {
                        await _projectManager.LaunchProjectAsync(proj.Project.Id);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show($"Failed to launch '{proj.Project.DisplayName}': {ex.Message}", "Sevelr Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                });
                projectsMenu.DropDownItems.Add(projItem);
            }
        }
        menu.Items.Add(projectsMenu);

        // 3. Status
        var statusItem = new ToolStripMenuItem($"Status: {(_enforcementPaused ? "Paused" : "Enforcing Active")}") { Enabled = false };
        menu.Items.Add(statusItem);

        // 4. Pause / Resume Enforcement
        var toggleEnforceItem = new ToolStripMenuItem(_enforcementPaused ? "Resume Enforcement" : "Pause Enforcement", null, (s, e) =>
        {
            _enforcementPaused = !_enforcementPaused;
            _notifyIcon.Text = _enforcementPaused ? "Sevelr - Enforcement Paused" : $"Sevelr - Active (Port {_serverPort})";
            RebuildContextMenu();
        });
        menu.Items.Add(toggleEnforceItem);
        menu.Items.Add(new ToolStripSeparator());

        // 5. Diagnostics
        menu.Items.Add(new ToolStripMenuItem("Run Diagnostics", null, (s, e) => OpenDashboardUrl("/#diagnostics")));

        // 6. Settings
        menu.Items.Add(new ToolStripMenuItem("Settings", null, (s, e) => OpenDashboardUrl("/#settings")));

        // 7. Restart Agent
        menu.Items.Add(new ToolStripMenuItem("Restart Agent", null, (s, e) =>
        {
            _logger.Log(new AuditEvent { Severity = LogSeverity.Info, Component = "Tray", Action = "agent.restart", Details = "User requested agent restart from tray." });
            RebuildContextMenu();
        }));

        menu.Items.Add(new ToolStripSeparator());

        // 8. Exit Sevelr
        menu.Items.Add(new ToolStripMenuItem("Exit Sevelr", null, (s, e) =>
        {
            _notifyIcon.Visible = false;
            ExitThread();
        }));

        _notifyIcon.ContextMenuStrip = menu;
    }

    public void OpenDashboard()
    {
        OpenDashboardUrl("/");
    }

    public void OpenDashboardUrl(string path)
    {
        try
        {
            var url = $"http://localhost:{_serverPort}{path}";
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            _logger.Log(new AuditEvent
            {
                Severity = LogSeverity.Warning,
                Component = "Tray",
                Action = "dashboard.open_failed",
                Details = ex.Message
            });
        }
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            _notifyIcon.Visible = false;
            _notifyIcon.Dispose();
        }
        base.Dispose(disposing);
    }
}
