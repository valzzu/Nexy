/// <reference types="node" />
/// <reference types="jest" />

declare global {
    const VERSION: string;
    const NIGHTLY: boolean;

    const WINDOWS: boolean;
    const LINUX: boolean;
    const ELECTRON: boolean;
    const IS_WINDOWS: boolean;
    const IS_LINUX: boolean;
    const IS_MACOS: boolean;

    interface Window {
        $pinia: any;
        $bridge: any;
        $vr: any;
        $debug: AppDebug;
        AppApi: AppApi;
        AppApiVr: AppApiVr;
        WebApi: WebApi;
        VRCXStorage: VRCXStorage;
        SQLite: SQLite;
        webApiService: webApiService;
        request: any;
        utils: any;
        dayjs: any;
        configRepository: any;
        database: any;
        crypto: any;
        sqliteService: any;
        isVrOverlay: boolean;
        interopApi: {
            callDotNetMethod: (className: any, methodName: any, args: any) => Promise<any>;
        };
        electron: {
            getArch: () => Promise<string>;
            getClipboardText: () => Promise<string>;
            copyImageToClipboard: (path: string) => Promise<boolean>;
            focusWindow: () => Promise<void>;
            flashWindow: () => Promise<void>;
            setStartup: (enabled: boolean) => Promise<void>;
            openCalendarFile: (content: string) => Promise<void>;
            getNoUpdater: () => Promise<boolean>;
            getCanInstallUpdates: () => Promise<boolean>;
            setTrayIconNotification: (notify: boolean) => Promise<void>;
            setThemeSource: (source: 'system' | 'light' | 'dark') => Promise<void>;
            onSystemThemeChanged: (Function: (event: any, isDark: boolean) => void) => () => void;
            openFileDialog: () => Promise<string>;
            openDirectoryDialog: () => Promise<string>;
            desktopNotification: (displayName: string, body?: string, image?: string) => Promise<void>;
            onWindowPositionChanged: (Function: (event: any, position: { x: number; y: number }) => void) => () => void;
            onWindowSizeChanged: (
                Function: (event: any, size: { width: number; height: number }) => void
            ) => () => void;
            onWindowStateChange: (Function: (event: any, state: { windowState: any }) => void) => () => void;
            onBrowserFocus: (Function: (event: any) => void) => () => void;
            onBrowserBlur: (Function: (event: any) => void) => () => void;
            onVrOverlayReady: (callback: (event: any) => void) => () => void;
            restartApp: (isUpgrade?: boolean) => Promise<void>;
            getOverlayWindow: () => Promise<boolean>;
            updateVr: (
                active: boolean,
                hmdOverlay: boolean,
                wristOverlay: boolean,
                menuButton: boolean,
                overlayHand: number
            ) => Promise<void>;
            ipcRenderer: {
                on(channel: String, func: (...args: unknown[]) => void): (() => void) | undefined;
            };
        };
    }

    interface AppDebug {
        debug: boolean;
        debugWebSocket: boolean;
        debugUserDiff: boolean;
        debugGameLog: boolean;
        debugWebRequests: boolean;
        debugFriendState: boolean;
        debugRecompute: boolean;
        debugIPC: boolean;
        errorNoty: any;
        dontLogMeOut: boolean;
        endpointDomain: string;
        endpointDomainVrchat: string;
        websocketDomain: string;
        websocketDomainVrchat: string;
    }

    const VRCXStorage: {
        Get(key: string): Promise<string>;
        Set(key: string, value: string): Promise<void>;
        Remove(key: string): Promise<void>;
        GetAll(): Promise<string>;
        Flush(): Promise<void>;
        Save(): Promise<void>;
        Load(): Promise<void>;
        GetArray(key: string): Promise<any[]>;
        SetArray(key: string, value: any[]): Promise<void>;
        GetObject(key: string): Promise<object>;
        SetObject(key: string, value: object): Promise<void>;
    };

    const SQLite: {
        Execute: (sql: string, args: string) => Promise<any[]>;
        ExecuteJson: (sql: string, args: string) => Promise<string>;
        ExecuteNonQuery: (sql: string, args: string) => Promise<Number>;
        ExecuteInsert: (sql: string, args: string) => Promise<Number>;
    };

    const AppApi: {
        // Basic App Functions
        ShowDevTools(): Promise<void>;
        SetVR(
            active: boolean,
            hmdOverlay: boolean,
            wristOverlay: boolean,
            menuButton: boolean,
            overlayHand: number
        ): Promise<void>;
        SetZoom(zoomLevel: number): Promise<void>;
        GetZoom(): Promise<number>;
        DesktopNotification(boldText: string, text?: string, image?: string): Promise<void>;
        RestartApplication(isUpgrade: boolean): Promise<void>;
        CheckForUpdateExe(): Promise<boolean>;
        ExecuteVrOverlayFunction(key: string, json: string): Promise<void>;
        FocusWindow(): Promise<void>;
        ChangeTheme(value: number): Promise<void>;
        DoFunny(): Promise<void>;
        GetClipboard(): Promise<string>;
        SetStartup(enabled: boolean): Promise<void>;
        CopyImageToClipboard(path: string): Promise<void>;
        FlashWindow(): Promise<void>;
        SetUserAgent(): Promise<void>;
        SetTrayIconNotification(notify: boolean): Promise<void>;
        OpenCalendarFile(icsContent: string): Promise<void>;

        // Common Functions
        GetColourFromUserID(userId: string): Promise<number>;
        OpenLink(url: string): Promise<void>;
        OpenDiscordProfile(discordId: string): Promise<void>;
        GetLaunchCommand(): Promise<string>;
        IPCAnnounceStart(): Promise<void>;
        SendIpc(type: string, data: string): Promise<void>;
        CustomCss(): Promise<string>;
        CustomScript(): Promise<string>;
        CurrentCulture(): Promise<string>;
        CurrentLanguage(): Promise<string>;
        GetVersion(): Promise<string>;
        GameClosedGracefully(): Promise<boolean>;
        GetColourBulk(userIds: string[]): Promise<Record<string, number>>;
        SetAppLauncherSettings(enabled: boolean, killOnExit: boolean, runProcessOnce: boolean): Promise<void>;
        GetFileBase64(path: string): Promise<string | null>;
        TryOpenInstanceInVrc(launchUrl: string): Promise<boolean>;
        JoinNexvrInstance(instanceId: string): Promise<boolean>;

        // Folders
        OpenVrcxAppDataFolder(): Promise<boolean>;
        OpenShortcutFolder(): Promise<void>;
        OpenFolderAndSelectItem(path: string, isFolder?: boolean): Promise<void>;
        OpenFolderSelectorDialog(defaultPath?: string): Promise<string>;
        OpenFileSelectorDialog(defaultPath?: string, defaultExt?: string, defaultFilter?: string): Promise<string>;

        // Game Handler
        OnProcessStateChanged(monitoredProcess: any): Promise<void>;
        CheckGameRunning(): Promise<void>;
        IsGameRunning(): Promise<boolean>;
        IsSteamVRRunning(): Promise<boolean>;
        QuitGame(): Promise<number>;
        StartGame(args: string): Promise<boolean>;
        StartGameFromPath(path: string, args: string): Promise<boolean>;

        // Image Functions
        PopulateImageHosts(json: string): Promise<void>;
        GetImage(url: string, fileId: string, version: string): Promise<string>;

        // Update
        DownloadUpdate(fileUrl: string, hashString: string, downloadSize: number): Promise<void>;
        CancelUpdate(): Promise<void>;
        CheckUpdateProgress(): Promise<number>;

        // Notifications
        XSNotification(title: string, content: string, timeout: number, opacity: number, image?: string): Promise<void>;
        OVRTNotification(
            hudNotification: boolean,
            wristNotification: boolean,
            title: string,
            body: string,
            timeout: number,
            opacity: number,
            image?: string
        ): Promise<void>;
    };

    const AppApiVr: {
        Init(): Promise<void>;
        VrInit(): Promise<void>;
        ToggleSystemMonitor(enabled: boolean): Promise<void>;
        CpuUsage(): Promise<number>;
        GetVRDevices(): Promise<string[][]>;
        GetUptime(): Promise<number>;
        CurrentCulture(): Promise<string>;
        CustomVrScript(): Promise<string>;
        GetExecuteVrOverlayFunctionQueue(): Promise<Map<string, string>>;
    };

    const WebApi: {
        ClearCookies(): Promise<void>;
        GetCookies(): Promise<string>;
        SetCookies(cookie: string): Promise<void>;
        Execute(options: any): Promise<{ Item1: number; Item2: string }>;
        ExecuteJson(requestJson: string): Promise<string>;
    };

    const webApiService: {
        clearCookies(): Promise<void>;
        getCookies(): Promise<string>;
        setCookies(cookie: string): Promise<void>;
        execute(options: {
            url: string;
            method?: string;
            headers?: Record<string, string>;
            data?: any;
        }): Promise<{ status: number; data: string }>;
    };
}

export {};
