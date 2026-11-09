@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Your computer and phone must be on the same private Wi-Fi.
echo Find your PC's LAN IPv4 address using: ipconfig
set /p LANIP=Enter PC private IPv4 (example 192.168.0.10): 
where py >nul 2>nul || (echo Python launcher required & pause & exit /b 1)
where npm >nul 2>nul || (echo Node.js required & pause & exit /b 1)
py scripts\configure_android.py phone %LANIP% || (pause & exit /b 1)
call npm ci || (pause & exit /b 1)
call npx cap sync android || (pause & exit /b 1)
echo Run Django as: .venv\Scripts\python.exe manage.py runserver 0.0.0.0:8000
echo Make sure DJANGO_ALLOWED_HOSTS includes the PC LAN IP.
pause
