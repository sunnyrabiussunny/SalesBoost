@echo off
REM SalesBoost CRM - one-click installer for Windows
REM Requires Docker Desktop to be installed and running.

setlocal

echo ==================================
echo   SalesBoost CRM Installer (Windows)
echo ==================================

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker not found.
    echo Please install Docker Desktop first: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

docker info >nul 2>nul
if %errorlevel% neq 0 (
    echo Docker Desktop does not appear to be running.
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Generate a .env file with a random secret if it doesn't exist
if not exist .env (
    echo Generating secret key...
    powershell -Command "$bytes = New-Object byte[] 32; (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); $hex = -join ($bytes | ForEach-Object { $_.ToString('x2') }); 'JWT_SECRET=' + $hex | Out-File -Encoding ascii .env"
)

echo Building and starting SalesBoost CRM...
docker compose down 2>nul
docker compose up -d --build

echo.
echo ==================================
echo   SalesBoost CRM is running!
echo ==================================
echo   URL:     http://localhost:5757
echo   Login:   admin@crm.local / admin123
echo ==================================
echo.
echo To view logs:  docker compose logs -f
echo To stop:       docker compose down

pause
