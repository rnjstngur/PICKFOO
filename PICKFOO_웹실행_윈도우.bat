@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 tools\serve.py
  goto END
)
where python >nul 2>nul
if %errorlevel%==0 (
  python tools\serve.py
  goto END
)
echo Python 3 not found. Install Python 3, or install Node.js and run npm ci / npm run start.
:END
pause
