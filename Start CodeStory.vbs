Option Explicit

Dim shell, folder, node, command
Set shell = CreateObject("WScript.Shell")
folder = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
node = "C:\Program Files\nodejs\node.exe"

shell.CurrentDirectory = folder
command = "cmd.exe /c ""set PORT=4197&&""" & node & """ server.js"""
shell.Run command, 0, False
WScript.Sleep 1200
shell.Run "http://localhost:4197", 1, False
