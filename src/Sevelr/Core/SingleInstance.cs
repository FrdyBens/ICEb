using System.IO.Pipes;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;

namespace Sevelr.Core;

public sealed class SingleInstance : IDisposable
{
    private const string MutexName = @"Global\Sevelr_Instance_Mutex_v2";
    private const string PipeName = @"Sevelr_Instance_Pipe_v2";

    private Mutex? _mutex;
    private bool _hasHandle;
    private CancellationTokenSource? _cts;
    private Task? _pipeServerTask;
    public event Action<string>? MessageReceived;

    public bool TryAcquire()
    {
        try
        {
            _mutex = new Mutex(true, MutexName, out _hasHandle);
            if (!_hasHandle)
            {
                // Another instance is already running
                return false;
            }

            StartPipeServer();
            return true;
        }
        catch (AbandonedMutexException)
        {
            _hasHandle = true;
            StartPipeServer();
            return true;
        }
        catch
        {
            return true; // Fallback to proceed if mutex creation is restricted
        }
    }

    public static async Task SendToExistingInstanceAsync(string message)
    {
        try
        {
            using var pipe = new NamedPipeClientStream(".", PipeName, PipeDirection.Out);
            await pipe.ConnectAsync(1500);
            var buffer = Encoding.UTF8.GetBytes(message);
            await pipe.WriteAsync(buffer);
            await pipe.FlushAsync();
        }
        catch
        {
            // If pipe connection fails, silently ignore
        }
    }

    private void StartPipeServer()
    {
        _cts = new CancellationTokenSource();
        _pipeServerTask = Task.Run(async () =>
        {
            while (!_cts.Token.IsCancellationRequested)
            {
                try
                {
                    using var server = new NamedPipeServerStream(
                        PipeName,
                        PipeDirection.In,
                        NamedPipeServerStream.MaxAllowedServerInstances,
                        PipeTransmissionMode.Byte,
                        PipeOptions.Asynchronous);

                    await server.WaitForConnectionAsync(_cts.Token);
                    using var reader = new StreamReader(server, Encoding.UTF8);
                    var msg = await reader.ReadToEndAsync(_cts.Token);
                    if (!string.IsNullOrWhiteSpace(msg))
                    {
                        MessageReceived?.Invoke(msg);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch
                {
                    await Task.Delay(500, _cts.Token);
                }
            }
        }, _cts.Token);
    }

    public void Dispose()
    {
        _cts?.Cancel();
        _cts?.Dispose();
        if (_hasHandle && _mutex != null)
        {
            try
            {
                _mutex.ReleaseMutex();
            }
            catch { }
        }
        _mutex?.Dispose();
    }
}
