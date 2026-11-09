@echo off
cd /d "%~dp0backend"
if not exist .env (
 echo backend\.env is missing. Copy .env.example, and set your credentials.
 pause
 exit /b 1
)
.venv\Scripts\python.exe manage.py migrate
if errorlevel 1 (pause & exit /b 1)
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
pause
