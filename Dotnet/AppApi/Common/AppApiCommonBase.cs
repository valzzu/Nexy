using System.Collections.Generic;
using System.Threading.Tasks;
using NLog;

namespace VRCX
{
    public abstract partial class AppApi
    {
        // AppApi
        public abstract void ShowDevTools();
        public abstract void SetVR(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand);
        public abstract void SetZoom(double zoomLevel);
        public abstract Task<double> GetZoom();
        public abstract void DesktopNotification(string BoldText, string Text = "", string Image = "");
        public abstract void SetTrayIconNotification(bool notify);

        public abstract void RestartApplication(bool isUpgrade);
        public abstract bool CheckForUpdateExe();
        public abstract void ExecuteVrOverlayFunction(string function, string json);
        public abstract void FocusWindow();
        public abstract void ChangeTheme(int value);
        public abstract void DoFunny();
        public abstract string GetClipboard();
        public abstract void SetStartup(bool enabled);
        public abstract void CopyImageToClipboard(string path);
        public abstract void FlashWindow();
        public abstract void SetUserAgent();
        public abstract void OpenCalendarFile(string icsContent);

        // Folders
        public abstract bool OpenVrcxAppDataFolder();
        public abstract void OpenShortcutFolder();
        public abstract void OpenFolderAndSelectItem(string path, bool isFolder = false);
        public abstract Task<string> OpenFolderSelectorDialog(string defaultPath = "");

        public abstract Task<string> OpenFileSelectorDialog(string defaultPath = "", string defaultExt = "",
            string defaultFilter = "All files (*.*)|*.*");

        // GameHandler
        public abstract void OnProcessStateChanged(MonitoredProcess monitoredProcess);
        public abstract void CheckGameRunning();
        public abstract bool IsGameRunning();
        public abstract bool IsSteamVRRunning();
        public abstract int QuitGame();
        public abstract bool StartGame(string arguments);
        public abstract bool StartGameFromPath(string path, string arguments);

    }
}
