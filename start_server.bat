@echo off
echo Starting AegisNet IoT Dashboard Server...
echo Press Ctrl+C to stop the server.

:: Navigate to the script's directory (in case it is run from somewhere else)
cd /d "%~dp0"

:: Start the Vite dev server
call npm run dev

pause
