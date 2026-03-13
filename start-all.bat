@echo off
REM Start all services for Quickmatch (Windows)

SET ROOT=%~dp0
cd /d "%ROOT%"

echo Starting Docker infrastructure (Postgres + Redis)...
docker compose up -d

echo Starting API server (port 3001)...
start "Quickmatch API" cmd /k "cd /d "%ROOT%api-server" && npm install && npm run dev"

echo Starting Socket server...
start "Quickmatch Socket" cmd /k "cd /d "%ROOT%socket-server" && npm install && npm run dev"

echo Starting Next.js frontend (port 3000)...
start "Quickmatch Frontend" cmd /k "cd /d "%ROOT%client" && npm install && npm run dev"

echo All processes launched. Access the app at http://localhost:3000
pause
