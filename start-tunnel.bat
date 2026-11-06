@echo off
title Cloudflare Public Tunnel
echo ===================================================
echo   Starting Cloudflare Live URL Tunnel (Port 8080)
echo ===================================================
echo.
echo Make sure your server is running (via start.bat) before using this.
echo.
"C:\Users\shaik\tools\cloudflared.exe" tunnel --url http://localhost:8080
pause
