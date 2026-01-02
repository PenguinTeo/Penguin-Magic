; Penguin Magic - Inno Setup Script
; Version: 0.2.5
; One-click EXE Installer with custom icon and user-selectable path

#define MyAppName "Penguin Magic"
#define MyAppVersion "0.2.5"
#define MyAppPublisher "Penguin Team"
#define MyAppURL "https://github.com/PenguinTeo/Penguin-Magic"
#define MyAppExeName "PenguinMagic.vbs"

[Setup]
; App Identity
AppId={{8A7B5C3D-1234-5678-9ABC-DEF012345678}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}

; Install Directory - User can choose
DefaultDirName={autopf}\PenguinMagic
DefaultGroupName={#MyAppName}

; Output Settings
OutputDir=..\
OutputBaseFilename=PenguinMagic-Setup-v{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes

; Wizard Style
WizardStyle=modern

; Permissions - No admin required
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

; Allow user to choose directory
DisableDirPage=no
DisableProgramGroupPage=yes
DisableReadyPage=no

; Language
ShowLanguageDialog=no

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Messages]
chinesesimplified.WelcomeLabel1=欢迎使用 Penguin Magic
chinesesimplified.WelcomeLabel2=这是一款 AI 图像桌面管理工具。%n%n点击"下一步"继续安装。
chinesesimplified.SelectDirLabel3=安装程序将把 Penguin Magic 安装到以下文件夹。
chinesesimplified.SelectDirBrowseLabel=点击"下一步"继续。如需选择其他文件夹，请点击"浏览"。
chinesesimplified.FinishedHeadingLabel=安装完成！
chinesesimplified.FinishedLabel=Penguin Magic 已成功安装。%n%n双击桌面的"Penguin Magic"图标即可启动。

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加选项:"; Flags: checkedonce

[Files]
; Node.js Runtime
Source: "..\build\nodejs\*"; DestDir: "{app}\nodejs"; Flags: ignoreversion recursesubdirs createallsubdirs

; Backend Code
Source: "..\build\backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs

; Frontend Build
Source: "..\build\dist\*"; DestDir: "{app}\dist"; Flags: ignoreversion recursesubdirs createallsubdirs

; Launcher Scripts
Source: "..\build\launcher\*"; DestDir: "{app}\launcher"; Flags: ignoreversion recursesubdirs createallsubdirs

[Dirs]
; Data directories - user writable
Name: "{app}\data"; Permissions: users-modify
Name: "{app}\input"; Permissions: users-modify
Name: "{app}\output"; Permissions: users-modify
Name: "{app}\creative_images"; Permissions: users-modify
Name: "{app}\thumbnails"; Permissions: users-modify

[Icons]
; Start Menu
Name: "{group}\{#MyAppName}"; Filename: "{app}\launcher\{#MyAppExeName}"; WorkingDir: "{app}"
Name: "{group}\Stop Service"; Filename: "{app}\launcher\StopService.bat"; WorkingDir: "{app}"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

; Desktop Shortcut
Name: "{autodesktop}\Penguin Magic"; Filename: "{app}\launcher\{#MyAppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
; Launch after install
Filename: "{app}\launcher\{#MyAppExeName}"; Description: "启动 Penguin Magic"; Flags: nowait postinstall skipifsilent shellexec; WorkingDir: "{app}"

[UninstallRun]
; Stop service before uninstall
Filename: "{app}\launcher\StopService.bat"; Flags: runhidden waituntilterminated; RunOnceId: "StopService"

[UninstallDelete]
; Clean up program files (keep user data)
Type: filesandordirs; Name: "{app}\nodejs"
Type: filesandordirs; Name: "{app}\backend"
Type: filesandordirs; Name: "{app}\dist"
Type: filesandordirs; Name: "{app}\launcher"

[Code]
// Stop existing service before install
procedure CurStepChanged(CurStep: TSetupStep);
var
  ResultCode: Integer;
begin
  if CurStep = ssInstall then
  begin
    Exec('cmd.exe', '/c for /f "tokens=5" %a in (''netstat -ano 2^>nul ^| findstr ":8766 " ^| findstr "LISTENING"'') do taskkill /f /pid %a', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

// Stop service before uninstall
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  ResultCode: Integer;
begin
  if CurUninstallStep = usUninstall then
  begin
    Exec('cmd.exe', '/c for /f "tokens=5" %a in (''netstat -ano 2^>nul ^| findstr ":8766 " ^| findstr "LISTENING"'') do taskkill /f /pid %a', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;
