' Penguin Magic Launcher - Hidden Window
' Double click to start Penguin Magic

Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the parent directory of the launcher folder (installation root)
strLauncherDir = FSO.GetParentFolderName(WScript.ScriptFullName)
strInstallDir = FSO.GetParentFolderName(strLauncherDir)

' Set working directory to installation root
WshShell.CurrentDirectory = strInstallDir

' Run the launcher batch file
WshShell.Run Chr(34) & strLauncherDir & "\PenguinMagic.bat" & Chr(34), 0, False

Set FSO = Nothing
Set WshShell = Nothing
