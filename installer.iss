[Setup]
AppName=企鹅工坊
AppVersion=0.2.5
DefaultDirName={autopf}\企鹅工坊
DefaultGroupName=企鹅工坊
OutputDir=release
OutputBaseFilename=企鹅工坊-Setup-0.2.5
Compression=lzma2
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=admin
SetupIconFile=assets\icon.ico
UninstallDisplayIcon={app}\企鹅工坊.exe

[Languages]
Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加图标:"

[Files]
Source: "release\win-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\企鹅工坊"; Filename: "{app}\企鹅工坊.exe"
Name: "{group}\卸载企鹅工坊"; Filename: "{uninstallexe}"
Name: "{autodesktop}\企鹅工坊"; Filename: "{app}\企鹅工坊.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\企鹅工坊.exe"; Description: "启动企鹅工坊"; Flags: nowait postinstall skipifsilent
