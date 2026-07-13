# autostart-domain.ps1
# Auto-start for logpxai.co.kr -- Next.js production server (port 3001) + Cloudflare tunnel (myvoicekids)
# Launched at logon by: Startup folder -> logpxai-autostart.cmd
# To disable: delete logpxai-autostart.cmd from the Startup folder.
# NOTE: This runs the PRODUCTION build (npm start). After changing code you must
#       rebuild once with: npm run build

$ErrorActionPreference = "SilentlyContinue"
$proj  = "C:\IBKS\workspace\sogang-project"
$npm   = "C:\Program Files\nodejs\npm.cmd"
$cf    = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$log   = "$proj\autostart.log"
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

"[$stamp] === autostart begin ===" | Out-File $log -Append -Encoding utf8

# 1) Next.js production server (port 3001 via PORT env) -- skip if already listening
#    NOTE: package.json "start" is env-neutral ("next start"); local port is pinned here.
if (-not (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue)) {
    $env:PORT = "3001"
    Start-Process -FilePath $npm -ArgumentList "start" `
                  -WorkingDirectory $proj -WindowStyle Hidden
    "[$stamp] production server started (port 3001)" | Out-File $log -Append -Encoding utf8
} else {
    "[$stamp] production server already running -- skipped" | Out-File $log -Append -Encoding utf8
}

# 2) Cloudflare tunnel -- skip if already running
if (-not (Get-Process cloudflared -ErrorAction SilentlyContinue)) {
    Start-Process -FilePath $cf -ArgumentList "tunnel","run","myvoicekids" -WindowStyle Hidden
    "[$stamp] cloudflared tunnel started (myvoicekids)" | Out-File $log -Append -Encoding utf8
} else {
    "[$stamp] cloudflared already running -- skipped" | Out-File $log -Append -Encoding utf8
}
