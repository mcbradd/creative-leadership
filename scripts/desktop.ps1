<#
.SYNOPSIS
  Local desktop automation for iterating on this project (screen capture, mouse,
  keyboard, window focus). Windows-only, zero dependencies — uses .NET directly.

.EXAMPLE
  powershell -File scripts/desktop.ps1 screenshot -Path outputs/screen.png
  powershell -File scripts/desktop.ps1 screenshot -Window "Chrome" -Path outputs/chrome.png
  powershell -File scripts/desktop.ps1 windows
  powershell -File scripts/desktop.ps1 focus -Window "Chrome"
  powershell -File scripts/desktop.ps1 click -X 400 -Y 300
  powershell -File scripts/desktop.ps1 type -Text "npm run dev{ENTER}"
  powershell -File scripts/desktop.ps1 keys -Text "^s"
  powershell -File scripts/desktop.ps1 cursor
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory, Position = 0)]
  [ValidateSet('screenshot', 'windows', 'focus', 'move', 'click', 'doubleclick', 'rightclick', 'scroll', 'type', 'keys', 'cursor')]
  [string]$Action,

  [string]$Path,
  [string]$Window,
  [string]$Text,
  [int]$X = -1,
  [int]$Y = -1,
  [int]$Amount = 3
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

Add-Type @'
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class Native {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint flags, int dx, int dy, int data, UIntPtr extra);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }

  public const uint LEFTDOWN = 0x0002, LEFTUP = 0x0004, RIGHTDOWN = 0x0008, RIGHTUP = 0x0010, WHEEL = 0x0800;
}
'@

function Resolve-Window {
  param([string]$Match)
  $candidates = Get-Process |
    Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle } |
    Where-Object { $_.MainWindowTitle -like "*$Match*" -or $_.ProcessName -like "*$Match*" }

  if (-not $candidates) { throw "No window matching '$Match'. Run: powershell -File scripts/desktop.ps1 windows" }
  $candidates | Select-Object -First 1
}

function Resolve-OutPath {
  param([string]$Candidate, [string]$Default)
  $target = if ($Candidate) { $Candidate } else { $Default }
  $full = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $target))
  $dir = Split-Path $full -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $full
}

function Move-To {
  if ($X -ge 0 -and $Y -ge 0) {
    [Native]::SetCursorPos($X, $Y) | Out-Null
    Start-Sleep -Milliseconds 60
  }
}

switch ($Action) {
  'windows' {
    Get-Process |
      Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle } |
      Select-Object ProcessName, Id, MainWindowTitle |
      Sort-Object ProcessName |
      Format-Table -AutoSize
  }

  'screenshot' {
    if ($Window) {
      $proc = Resolve-Window $Window
      [Native]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
      Start-Sleep -Milliseconds 300
      $rect = New-Object Native+RECT
      [Native]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
      $bounds = New-Object Drawing.Rectangle $rect.Left, $rect.Top, ($rect.Right - $rect.Left), ($rect.Bottom - $rect.Top)
    }
    else {
      $bounds = [Windows.Forms.SystemInformation]::VirtualScreen
    }

    $bitmap = New-Object Drawing.Bitmap $bounds.Width, $bounds.Height
    try {
      $graphics = [Drawing.Graphics]::FromImage($bitmap)
      try { $graphics.CopyFromScreen($bounds.Location, [Drawing.Point]::Empty, $bounds.Size) }
      finally { $graphics.Dispose() }

      $out = Resolve-OutPath $Path "outputs/desktop-$(Get-Date -Format yyyyMMdd-HHmmss).png"
      $bitmap.Save($out, [Drawing.Imaging.ImageFormat]::Png)
      Write-Output $out
    }
    finally { $bitmap.Dispose() }
  }

  'focus' {
    $proc = Resolve-Window $Window
    [Native]::ShowWindow($proc.MainWindowHandle, 9) | Out-Null   # SW_RESTORE
    [Native]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
    Write-Output $proc.MainWindowTitle
  }

  'cursor' {
    $pos = [Windows.Forms.Cursor]::Position
    Write-Output "$($pos.X),$($pos.Y)"
  }

  'move' { Move-To }

  'click' {
    Move-To
    [Native]::mouse_event([Native]::LEFTDOWN, 0, 0, 0, [UIntPtr]::Zero)
    [Native]::mouse_event([Native]::LEFTUP, 0, 0, 0, [UIntPtr]::Zero)
  }

  'doubleclick' {
    Move-To
    foreach ($i in 1..2) {
      [Native]::mouse_event([Native]::LEFTDOWN, 0, 0, 0, [UIntPtr]::Zero)
      [Native]::mouse_event([Native]::LEFTUP, 0, 0, 0, [UIntPtr]::Zero)
      Start-Sleep -Milliseconds 50
    }
  }

  'rightclick' {
    Move-To
    [Native]::mouse_event([Native]::RIGHTDOWN, 0, 0, 0, [UIntPtr]::Zero)
    [Native]::mouse_event([Native]::RIGHTUP, 0, 0, 0, [UIntPtr]::Zero)
  }

  'scroll' {
    Move-To
    [Native]::mouse_event([Native]::WHEEL, 0, 0, ($Amount * -120), [UIntPtr]::Zero)
  }

  # SendKeys goes to whatever currently has focus — pass -Window or run `focus` first.
  # `type` sends literal text; `keys` passes SendKeys syntax through (^s, %{F4}, {ENTER}).
  { $_ -in 'type', 'keys' } {
    if (-not $Text) { throw "-Text is required for '$Action'" }
    if ($Window) {
      $proc = Resolve-Window $Window
      [Native]::ShowWindow($proc.MainWindowHandle, 9) | Out-Null
      [Native]::SetForegroundWindow($proc.MainWindowHandle) | Out-Null
      Start-Sleep -Milliseconds 300
    }
    $payload = if ($Action -eq 'type') { [regex]::Replace($Text, '[+^%~(){}\[\]]', '{$0}') } else { $Text }
    [Windows.Forms.SendKeys]::SendWait($payload)
  }
}
