@echo off
chcp 65001 >nul
cd /d "%~dp0"
py scripts\configure_android.py packaged || (pause & exit /b 1)
call npm ci || (pause & exit /b 1)
call npx cap sync android || (pause & exit /b 1)
echo UI assets packaged. Database/login DO NOT automatically work without deployed server integration.
pause
