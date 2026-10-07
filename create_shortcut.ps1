$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    [Environment]::GetFolderPath('CommonDesktopDirectory'),
    [System.IO.Path]::Combine($env:USERPROFILE, 'Desktop')
) | Select-Object -Unique

foreach ($dp in $desktopPaths) {
    if (Test-Path $dp) {
        $shortcutPath = [System.IO.Path]::Combine($dp, 'ระบบตรวจสอบภายใน (IA-OS).lnk')
        $wsh = New-Object -ComObject WScript.Shell
        $shortcut = $wsh.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = 'wscript.exe'
        $shortcut.Arguments = '"C:\Users\Windows11\.gemini\antigravity\scratch\internal-audit-app\launch_silent.vbs"'
        $shortcut.WorkingDirectory = 'C:\Users\Windows11\.gemini\antigravity\scratch\internal-audit-app'
        $shortcut.Description = 'ระบบปฏิบัติการตรวจสอบภายใน อปท. (IA-OS)'
        $shortcut.IconLocation = 'shell32.dll,23'
        $shortcut.Save()

        $urlPath = [System.IO.Path]::Combine($dp, 'ระบบตรวจสอบภายใน (IA-OS).url')
        "[InternetShortcut]`nURL=http://localhost:5173/`nIconIndex=0`nIconFile=C:\Windows\System32\shell32.dll" | Out-File -FilePath $urlPath -Encoding utf8
        Write-Host "Created shortcuts at: $dp"
    }
}
