using System.Windows.Forms;
using Sevelr.Applications;
using Sevelr.Browser;
using Sevelr.Commands;
using Sevelr.Configuration;
using Sevelr.Configuration.Models;
using Sevelr.Core;
using Sevelr.Diagnostics;
using Sevelr.Extensions;
using Sevelr.Filesystem;
using Sevelr.Logging;
using Sevelr.Network;
using Sevelr.Policies;
using Sevelr.Process;
using Sevelr.Projects;
using Sevelr.Runtime;
using Sevelr.Security;
using Sevelr.Snapshots;
using Sevelr.Storage;
using Sevelr.Tray;

namespace Sevelr;

public static class Program
{
    [STAThread]
    public static async Task<int> Main(string[] args)
    {
        // 1. Single-Instance Check
        using var singleInstance = new SingleInstance();
        bool isFirstInstance = singleInstance.TryAcquire();

        // 2. Initialize Core Infrastructure
        var logger = new AuditLogger();
        var storage = new StorageManager();
        var sqlite = new SqliteStorageManager();
        var aclManager = new WindowsAclManager(logger);
        var efsProvider = new WindowsEfsProvider(logger);
        var policyEngine = new PolicyCompiler();
        var extensionGen = new Mv3ExtensionGenerator();
        var networkEnforcer = new WindowsFirewallEnforcer(logger);
        var browserPolicy = new ChromiumPolicyManager(logger);
        var processManager = new WindowsProcessManager(logger);
        var runtimeState = new RuntimeStateManager();
        var tamperDetector = new TamperDetector(logger);
        var appFactory = new ApplicationProviderFactory();

        appFactory.RegisterProvider(new BraveApplicationProvider());
        appFactory.RegisterProvider(new CustomExecutableProvider());

        var projectManager = new ProjectManager(
            storage, aclManager, efsProvider, policyEngine,
            extensionGen, networkEnforcer, browserPolicy, processManager,
            runtimeState, tamperDetector, appFactory, logger);

        var snapshotManager = new SnapshotManager(storage, sqlite, logger);
        var doctorService = new DoctorService(projectManager, storage, aclManager, efsProvider, tamperDetector, appFactory);

        // 3. Handle Single-Instance Navigation if already running
        if (!isFirstInstance)
        {
            if (args.Length == 0)
            {
                await SingleInstance.SendToExistingInstanceAsync("open_dashboard");
                return Constants.ExitCodes.Success;
            }
        }

        // 4. If started with NO arguments: Standard Windows App / Tray Launch
        if (args.Length == 0)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            var trayContext = new TrayApplicationContext(projectManager, sqlite, logger, serverPort: 3000);
            singleInstance.MessageReceived += msg =>
            {
                if (msg == "open_dashboard")
                {
                    trayContext.OpenDashboard();
                }
            };

            // Open dashboard on initial start
            trayContext.OpenDashboard();

            // Run Windows Message Loop for Tray Icon
            Application.Run(trayContext);
            return Constants.ExitCodes.Success;
        }

        // 5. CLI Handling for advanced users / diagnostics / scripts
        OutputFormatter.PrintBanner();
        var parsed = CommandLineParser.Parse(args);

        if (string.IsNullOrEmpty(parsed.Command) || parsed.Flags.Contains("help"))
        {
            PrintUsage();
            return Constants.ExitCodes.Success;
        }

        try
        {
            switch (parsed.Command.ToLowerInvariant())
            {
                case "tray":
                case "start":
                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    var trayCtx = new TrayApplicationContext(projectManager, sqlite, logger, 3000);
                    Application.Run(trayCtx);
                    break;

                case "create":
                    var template = parsed.Options.GetValueOrDefault("template", "strict");
                    var created = projectManager.CreateProject(parsed.Target ?? throw new ConfigurationException("Project name is required."), template);
                    sqlite.SaveProject(created);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"[✓] Project '{parsed.Target}' created successfully using template '{template}'.");
                    Console.ResetColor();
                    break;

                case "launch":
                    await projectManager.LaunchProjectAsync(
                        parsed.Target ?? "default",
                        temporary: parsed.Flags.Contains("temporary"));
                    break;

                case "snapshot":
                    var snapshotPath = snapshotManager.CreateSnapshot(
                        parsed.Target ?? throw new ConfigurationException("Project ID is required."),
                        parsed.Options.GetValueOrDefault("name"));
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"[✓] Snapshot created: {snapshotPath}");
                    Console.ResetColor();
                    break;

                case "restore":
                    var snapFile = parsed.Target ?? throw new ConfigurationException("Snapshot file path is required.");
                    snapshotManager.RestoreSnapshot(snapFile);
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"[✓] Snapshot restored successfully.");
                    Console.ResetColor();
                    break;

                case "doctor":
                    var results = await doctorService.RunDiagnosticsAsync(parsed.Target ?? throw new ConfigurationException("Project name is required."));
                    bool allPass = true;
                    Console.WriteLine($"Diagnostics for '{parsed.Target}':\n");
                    foreach (var r in results)
                    {
                        Console.ForegroundColor = r.Passed ? ConsoleColor.Green : ConsoleColor.Red;
                        Console.WriteLine($" [{(r.Passed ? "PASS" : "FAIL")}] {r.Component}: {r.Details}");
                        if (!r.Passed && r.Remediation != null)
                            Console.WriteLine($"        Action: {r.Remediation}");
                        if (!r.Passed) allPass = false;
                    }
                    Console.ResetColor();
                    return allPass ? Constants.ExitCodes.Success : Constants.ExitCodes.DoctorCheckFailed;

                case "list":
                    var projects = sqlite.GetAllProjects();
                    Console.WriteLine($"Configured Projects ({projects.Count}):");
                    foreach (var p in projects)
                    {
                        Console.WriteLine($" • {p.Project.Id} ({p.Project.DisplayName}) - [{p.Project.Template}] - App: {p.Application.Provider}");
                    }
                    break;

                case "version":
                    Console.WriteLine($"Sevelr Universal Application Isolation Engine v{Constants.PlatformVersion}");
                    break;

                default:
                    Console.ForegroundColor = ConsoleColor.Yellow;
                    Console.WriteLine($"Unknown command '{parsed.Command}'. Use --help for usage.");
                    Console.ResetColor();
                    return Constants.ExitCodes.GenericFailure;
            }

            return Constants.ExitCodes.Success;
        }
        catch (SevelrException sex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"[!] Sevelr Error: {sex.Message}");
            Console.ResetColor();
            return Constants.ExitCodes.ConfigurationError;
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine($"[FATAL] Unexpected error: {ex.Message}");
            Console.ResetColor();
            return Constants.ExitCodes.GenericFailure;
        }
    }

    private static void PrintUsage()
    {
        Console.WriteLine(@"
Usage:
  sevelr                       Launch the full background agent & system tray with dashboard
  sevelr create <name>         Create a new isolated project (--template strict|balanced|dev)
  sevelr launch <name>         Launch an isolated project environment (--temporary)
  sevelr snapshot <name>       Create a local .sevelr snapshot of a project
  sevelr restore <file.sevelr> Restore a project snapshot safely
  sevelr doctor <name>         Run comprehensive diagnostic tests
  sevelr list                  List all projects in SQLite state
  sevelr version               Show version info
");
    }
}
