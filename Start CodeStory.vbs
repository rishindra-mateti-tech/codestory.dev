Option Explicit

Dim shell, folder, command
Set shell = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

shell.CurrentDirectory = folder
command = "cmd.exe /c node cli.js start"
shell.Run command, 0, False
