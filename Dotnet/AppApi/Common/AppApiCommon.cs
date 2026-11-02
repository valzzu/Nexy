using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using NLog;

namespace VRCX
{
    public partial class AppApi
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        public void Init()
        {
        }

        public JsonSerializerSettings JsonSerializerSettings = new JsonSerializerSettings
        {
            Error = delegate (object _, Newtonsoft.Json.Serialization.ErrorEventArgs args)
            {
                args.ErrorContext.Handled = true;
            }
        };

        public int GetColourFromUserID(string userId)
        {
            using var hasher = MD5.Create();
            var hash = hasher.ComputeHash(Encoding.UTF8.GetBytes(userId));
            return (hash[3] << 8) | hash[4];
        }

        public void OpenLink(string url)
        {
            if (string.IsNullOrWhiteSpace(url))
                return;

            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return;

            if (uri.Scheme != Uri.UriSchemeHttp &&
                uri.Scheme != Uri.UriSchemeHttps)
                return;

            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = uri.AbsoluteUri,
                    UseShellExecute = true
                };
                Process.Start(psi);
            }
            catch
            {
                logger.Error("Failed to open link: {url}", url);
            }
        }

        /// <summary>
        /// Hands an instance to the NexVR client through its nexvr:// protocol
        /// handler, the same link nexvr.net's Join button uses.
        /// </summary>
        public bool JoinNexvrInstance(string instanceId)
        {
            var startInfo = NexvrLaunch.ForInstance(instanceId);
            if (startInfo == null) return false;

            try
            {
                Process.Start(startInfo)?.Dispose();
                return true;
            }
            catch (Exception e)
            {
                logger.Error(e, "Failed to open NexVR instance {instanceId}", instanceId);
                return false;
            }
        }

        public void OpenDiscordProfile(string discordId)
        {
            if (!long.TryParse(discordId, out _))
                throw new Exception("Invalid user ID");

            var uri = $"discord://-/users/{discordId}";
            Process.Start(new ProcessStartInfo(uri)
            {
                UseShellExecute = true
            });
        }

        public void OpenSteamStorePage(int appId)
        {
            Process.Start(new ProcessStartInfo($"steam://openurl/https://store.steampowered.com/app/{appId}/")
            {
                UseShellExecute = true
            });
        }

        public string GetLaunchCommand()
        {
            var command = StartupArgs.LaunchArguments.LaunchCommand;
            StartupArgs.LaunchArguments.LaunchCommand = string.Empty;
            return command;
        }

        public void IPCAnnounceStart()
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VRCXLaunch",
                MsgType = "VRCXLaunch"
            });
        }

        public void SendIpc(string type, string data)
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VrcxMessage",
                MsgType = type,
                Data = data
            });
        }

        public string CustomCss()
        {
            var filePath = Path.Join(Program.AppDataDirectory, "custom.css");
            if (File.Exists(filePath))
                return File.ReadAllText(filePath);

            return string.Empty;
        }

        public string CustomScript()
        {
            var filePath = Path.Join(Program.AppDataDirectory, "custom.js");
            if (File.Exists(filePath))
                return File.ReadAllText(filePath);

            return string.Empty;
        }

        public string CurrentCulture()
        {
            var culture = CultureInfo.CurrentCulture.ToString();
            if (string.IsNullOrEmpty(culture))
                culture = "en-US";

            return culture;
        }

        public string CurrentLanguage()
        {
            return CultureInfo.InstalledUICulture.Name;
        }

        public string GetVersion()
        {
            return Program.Version;
        }

        /// <summary>
        /// Whether the last NexVR session ended in a clean quit. Unity writes its
        /// input system shutdown near the end of Player.log on a normal exit; a
        /// crash stops the log before that line.
        /// </summary>
        public bool GameClosedGracefully()
        {
            // the NexVR client's data folder under Wine/Proton isn't known, so
            // never report a crash there rather than relaunch on every exit
            if (!OperatingSystem.IsWindows())
                return true;

            var logPath = Path.Join(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + "Low",
                "NexVR", "NexVR", "Player.log");
            try
            {
                using var stream = new FileStream(logPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                const int tailBytes = 16 * 1024;
                stream.Seek(Math.Max(0, stream.Length - tailBytes), SeekOrigin.Begin);
                using var reader = new StreamReader(stream, Encoding.UTF8);
                return reader.ReadToEnd().Contains("Input System module state changed to: Shutdown.", StringComparison.Ordinal);
            }
            catch (Exception ex)
            {
                logger.Warn(ex, "Failed to read NexVR Player.log");
                return true;
            }
        }

        public Dictionary<string, int> GetColourBulk(List<object> userIds)
        {
            var output = new Dictionary<string, int>();
            foreach (string userId in userIds)
            {
                output.Add(userId, GetColourFromUserID(userId));
            }

            return output;
        }

        public void SetAppLauncherSettings(bool enabled, bool killOnExit, bool runProcessOnce)
        {
            AutoAppLaunchManager.Instance.Enabled = enabled;
            AutoAppLaunchManager.Instance.KillChildrenOnExit = killOnExit;
            AutoAppLaunchManager.Instance.RunProcessOnce = runProcessOnce;
        }

        public string GetFileBase64(string path)
        {
            if (File.Exists(path))
            {
                return Convert.ToBase64String(File.ReadAllBytes(path));
            }

            return null;
        }

        public virtual Task<bool> TryOpenInstanceInVrc(string launchUrl)
        {
            return VRCIPC.Send(launchUrl);
        }
    }
}
