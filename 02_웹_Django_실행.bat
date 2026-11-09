@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
if not exist .env (echo [ERROR] backend\.env is missing. See 00_최종_통합본_실행가이드.md & pause & exit /b 1)
if not exist .venv\Scripts\python.exe (echo [ERROR] Install python env in backend\.venv first. & pause & exit /b 1)
echo Web URL: http://127.0.0.1:8000/index.html
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
pause
