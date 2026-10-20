@echo off
echo ======================================================================
echo Starting Dhanrakshak AI (Backend API + React Frontend)
echo ======================================================================

start "Dhanrakshak Backend" cmd /k "cd /d %~dp0backend && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 2 >nul
start "Dhanrakshak Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --host 0.0.0.0"

echo.
echo Dhanrakshak AI is starting!
echo Backend API:  http://0.0.0.0:8000 (Docs: http://127.0.0.1:8000/docs)
echo Frontend App: http://0.0.0.0:5173
echo Open http://<your-laptop-ip>:5173 on your mobile phone connected to the same Wi-Fi!
echo ======================================================================
