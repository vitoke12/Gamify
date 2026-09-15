' Lanza iniciar-servidor.bat sin abrir ninguna ventana de consola.
' Es el paso que usa la tarea programada de Windows: sin este envoltorio,
' cada inicio de sesion abriria una ventana negra de fondo.
Dim fso, ruta
Set fso = CreateObject("Scripting.FileSystemObject")
ruta = fso.GetParentFolderName(WScript.ScriptFullName) & "\iniciar-servidor.bat"
CreateObject("WScript.Shell").Run """" & ruta & """", 0, False
