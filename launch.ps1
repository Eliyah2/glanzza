# Glanzza — deploy naar Vercel (PowerShell)
# Gebruik:  ./launch.ps1
# Eerste keer vraagt `vercel login` je om in te loggen in de browser (jouw Vercel-account).
# Daarna zet dit script de site live en toont het de productie-URL.

Set-Location $PSScriptRoot

Write-Host "== Glanzza launch ==" -ForegroundColor Cyan

# 1) Zorg dat je bent ingelogd (interactief, alleen eerste keer nodig)
Write-Host "Stap 1/2: inloggen bij Vercel (één keer)..."
vercel login

# 2) Live deployen
Write-Host "Stap 2/2: deployen naar productie..."
vercel --prod --yes

Write-Host "Klaar! Je productie-URL staat hierboven." -ForegroundColor Green
