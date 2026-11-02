using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Win32;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace VRCX
{
    public partial class AppApiElectron
    {
        public override bool OpenVrcxAppDataFolder()
        {
            var path = Program.AppDataDirectory;
            if (!Directory.Exists(path))
                return false;

            OpenFolderAndSelectItem(path, true);
            return true;
        }

        public override void OpenShortcutFolder()
        {
            var path = AutoAppLaunchManager.Instance.AppShortcutDirectory;
            if (!Directory.Exists(path))
                return;

            OpenFolderAndSelectItem(path, true);
        }

        public override void OpenFolderAndSelectItem(string path, bool isFolder = false)
        {
            if (!File.Exists(path) && !Directory.Exists(path))
                return;

            if (OperatingSystem.IsWindows())
            {
                var arguments = isFolder ? $"\"{path}\"" : $"/select,\"{path}\"";
                Process.Start(new ProcessStartInfo("explorer.exe", arguments) { UseShellExecute = true })?.Dispose();
                return;
            }

            if (OperatingSystem.IsMacOS())
            {
                var startInfo = new ProcessStartInfo("open") { UseShellExecute = false };
                if (!isFolder) startInfo.ArgumentList.Add("-R");
                startInfo.ArgumentList.Add(path);
                Process.Start(startInfo)?.Dispose();
                return;
            }

            string directoryPath = isFolder ? path : Path.GetDirectoryName(path);
            var commandAttempt = new Dictionary<string, string>
            {
                { "nautilus", $"\"{path}\"" },
                { "nemo", $"\"{path}\"" },
                { "thunar", $"\"{path}\"" },
                { "caja", $"--select \"{path}\"" },
                { "pcmanfm-qt", $"\"{directoryPath}\"" },
                { "pcmanfm", $"\"{directoryPath}\"" },
                { "dolphin", $"--select \"{path}\"" },
                { "konqueror", $"--select \"{path}\"" },
                { "xdg-open", $"\"{directoryPath}\"" }
            };

            foreach (var command in commandAttempt)
            {
                if (!IsCommandAvailable(command.Key))
                    continue;

                try
                {
                    var process = new Process
                    {
                        StartInfo = new ProcessStartInfo
                        {
                            FileName = command.Key,
                            Arguments = command.Value,
                            UseShellExecute = false,
                            RedirectStandardError = true,
                            RedirectStandardOutput = true,
                            CreateNoWindow = true,
                        }
                    };
                    process.Start();
                    return; // Assume first successful start is enough
                }
                catch
                {
                    // Ignore and try next
                }
            }
        }

        private bool IsCommandAvailable(string command)
        {
            try
            {
                var which = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "which",
                        Arguments = command,
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    }
                };
                which.Start();
                string result = which.StandardOutput.ReadToEnd();
                which.WaitForExit();
                return which.ExitCode == 0 && !string.IsNullOrWhiteSpace(result);
            }
            catch
            {
                return false;
            }
        }

        public override Task<string> OpenFolderSelectorDialog(string defaultPath = "")
        {
            throw DesktopOnly();
        }

        public override Task<string> OpenFileSelectorDialog(string defaultPath = "", string defaultExt = "",
            string defaultFilter = "All files (*.*)|*.*")
        {
            throw DesktopOnly();
        }
    }
}
