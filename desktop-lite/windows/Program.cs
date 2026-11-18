using System.Diagnostics;
using System.Net;
using System.Text;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace HscLite;

internal static class Program
{
    public const string Origin = "http://127.0.0.1:19828/";
    public static bool IsInternal(string text) => Uri.TryCreate(text, UriKind.Absolute, out var uri)
        && uri.Scheme == "http" && uri.Host == "127.0.0.1" && uri.Port == 19828 && string.IsNullOrEmpty(uri.UserInfo);
    public static void OpenExternal(string text)
    {
        if (!Uri.TryCreate(text, UriKind.Absolute, out var uri) || !string.IsNullOrEmpty(uri.UserInfo)
            || (uri.Scheme != "https" && uri.Scheme != "http" && uri.Scheme != "mailto" && uri.Scheme != "tel")) return;
        try { Process.Start(new ProcessStartInfo(text) { UseShellExecute = true }); } catch { }
    }
    [STAThread]
    static void Main(string[] args)
    {
        bool smoke = args.Contains("--smoke");
        ApplicationConfiguration.Initialize();
        try { using var form = new AppWindow(smoke); Application.Run(form); }
        catch (Exception e) { if (smoke) { Console.Error.WriteLine(e); Environment.ExitCode = 1; } else MessageBox.Show(e.Message, "HSC 2027 Lite"); }
    }
}

internal sealed class SiteServer : IDisposable
{
    readonly HttpListener listener = new();
    readonly string root;
    public SiteServer(string site)
    {
        root = Path.GetFullPath(site) + Path.DirectorySeparatorChar;
        if (!File.Exists(Path.Combine(site, "index.html"))) throw new Exception("Bundled site not found. Extract the whole ZIP before running.");
        listener.Prefixes.Add(Program.Origin);
        listener.Start(); // Fail closed rather than loading another process on the port.
        _ = Task.Run(Serve);
    }
    async Task Serve()
    {
        while (listener.IsListening)
        {
            HttpListenerContext ctx;
            try { ctx = await listener.GetContextAsync(); } catch { break; }
            _ = Task.Run(async () => {
                try {
                    if (ctx.Request.HttpMethod != "GET" && ctx.Request.HttpMethod != "HEAD") { ctx.Response.StatusCode = 405; return; }
                    string rel = Uri.UnescapeDataString(ctx.Request.Url!.AbsolutePath).TrimStart('/');
                    if (rel == "") rel = "index.html";
                    if (rel.Contains('\\') || rel.Contains('\0')) { ctx.Response.StatusCode = 400; return; }
                    string file = Path.GetFullPath(Path.Combine(root, rel));
                    if (!file.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(file)) { ctx.Response.StatusCode = 404; return; }
                    ctx.Response.ContentType = Path.GetExtension(file).ToLowerInvariant() switch {
                        ".html" => "text/html; charset=utf-8", ".js" => "text/javascript; charset=utf-8", ".css" => "text/css; charset=utf-8",
                        ".png" => "image/png", ".jpg" or ".jpeg" => "image/jpeg", ".svg" => "image/svg+xml", ".webp" => "image/webp", _ => "application/octet-stream"
                    };
                    ctx.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                    byte[] data = await File.ReadAllBytesAsync(file);
                    ctx.Response.ContentLength64 = data.Length;
                    if (ctx.Request.HttpMethod == "GET") await ctx.Response.OutputStream.WriteAsync(data);
                } catch { try { ctx.Response.StatusCode = 500; } catch { } }
                finally { ctx.Response.Close(); }
            });
        }
    }
    public void Dispose() => listener.Close();
}

internal sealed class AppWindow : Form
{
    readonly SiteServer server;
    readonly WebView2 web = new() { Dock = DockStyle.Fill };
    readonly bool smoke;
    readonly string userData;
    int stage;
    public AppWindow(bool test)
    {
        smoke = test;
        userData = test ? Path.Combine(Path.GetTempPath(), "hsc-lite-test-" + Guid.NewGuid()) : Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HSC2027Lite");
        server = new SiteServer(Path.Combine(AppContext.BaseDirectory, "site"));
        Text = "HSC 2027 Lite"; Width = 1200; Height = 800; MinimumSize = new(320, 480);
        var menu = new MenuStrip();
        var nav = new ToolStripMenuItem("নেভিগেশন");
        nav.DropDownItems.Add("হোম", null, (_, _) => web.CoreWebView2?.Navigate(Program.Origin + "index.html"));
        nav.DropDownItems.Add("পেছনে", null, (_, _) => { if (web.CanGoBack) web.GoBack(); });
        nav.DropDownItems.Add("সামনে", null, (_, _) => { if (web.CanGoForward) web.GoForward(); });
        nav.DropDownItems.Add("রিলোড", null, (_, _) => web.Reload());
        menu.Items.Add(nav); Controls.Add(web); Controls.Add(menu); MainMenuStrip = menu;
        Shown += async (_, _) => await StartAsync();
        FormClosed += (_, _) => { web.Dispose(); server.Dispose(); };
    }
    async Task StartAsync()
    {
        try {
            var environment = await CoreWebView2Environment.CreateAsync(null, userData);
            await web.EnsureCoreWebView2Async(environment);
            web.CoreWebView2.Settings.AreDevToolsEnabled = false;
            web.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            web.CoreWebView2.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
            web.CoreWebView2.NavigationStarting += (_, e) => { if (!Program.IsInternal(e.Uri)) { e.Cancel = true; if (!smoke) Program.OpenExternal(e.Uri); } };
            web.CoreWebView2.NewWindowRequested += (_, e) => { e.Handled = true; if (Program.IsInternal(e.Uri)) web.CoreWebView2.Navigate(e.Uri); else if (!smoke) Program.OpenExternal(e.Uri); };
            if (smoke) {
                var timer = new System.Windows.Forms.Timer { Interval = 30000 };
                timer.Tick += (_, _) => { Environment.ExitCode = 1; Close(); };
                timer.Start();
                web.CoreWebView2.NavigationCompleted += async (_, e) => {
                    try {
                        if (!e.IsSuccess) throw new Exception("Navigation failed: " + e.WebErrorStatus);
                        if (stage++ == 0) {
                            await web.CoreWebView2.ExecuteScriptAsync("localStorage.setItem('hsc2027:physics:0','1'); localStorage.setItem('site:theme','light')");
                            web.CoreWebView2.Navigate(Program.Origin + "tracker.html");
                        } else {
                            string result = await web.CoreWebView2.ExecuteScriptAsync("localStorage.getItem('hsc2027:physics:0') === '1' && document.querySelector('[data-subject=physics][data-chapter=\"0\"]').classList.contains('done') && document.documentElement.dataset.theme === 'light'");
                            if (result != "true") throw new Exception("Offline tracker/theme test failed: " + result);
                            Environment.ExitCode = 0; timer.Stop(); Close();
                        }
                    } catch (Exception ex) { Console.Error.WriteLine(ex); Environment.ExitCode = 1; Close(); }
                };
            }
            web.CoreWebView2.Navigate(Program.Origin + "index.html");
        } catch (Exception ex) { if (!smoke) MessageBox.Show("WebView2 Runtime প্রয়োজন। " + ex.Message, "HSC 2027 Lite"); else Console.Error.WriteLine(ex); Environment.ExitCode = 1; Close(); }
    }
}
