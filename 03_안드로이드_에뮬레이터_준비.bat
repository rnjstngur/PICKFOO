@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul || (echo Python launcher is required. & pause & exit /b 1)
where npm >nul 2>nul || (echo Node.js and npm are required. & pause & exit /b 1)
py scripts\configure_android.py emulator || (pause & exit /b 1)
call npm ci || (pause & exit /b 1)
call npx cap sync android || (pause & exit /b 1)
echo [OK] Open android folder in Android Studio, then Run on an emulator.
pause
