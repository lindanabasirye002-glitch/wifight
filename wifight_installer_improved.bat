@echo off
REM Run as Administrator. Place this file in project root.
cd /d %~dp0

echo Checking for Composer...
where composer >nul 2>&1
if %errorlevel% neq 0 (
  echo Composer not found. Please install Composer first: https://getcomposer.org/download/
  pause
  exit /b 1
)

echo Installing PHP dependencies...
composer install

echo Ensure backend\\config\\database.php exists...
if not exist backend\config\database.php (
  if exist backend\config\config.sample.php (
    copy backend\config\config.sample.php backend\config\config.php
    echo Created backend\config\config.php from sample — edit it with credentials.
  ) else (
    echo No sample config found; please create backend\config\database.php with DB credentials.
  )
)

echo Importing schema (requires MySQL credentials)...
set /p rootpass="Enter MySQL root password (leave blank if none): "
if "%rootpass%"=="" (
  C:\xampp\mysql\bin\mysql -u root < database\schema.sql || echo Schema import failed
) else (
  C:\xampp\mysql\bin\mysql -u root -p%rootpass% < database\schema.sql || echo Schema import failed
)

echo Setting storage ACL...
icacls storage /grant Users:(OI)(CI)F /T

echo Done. Restart Apache and visit http://localhost/wifight/backend/test.php
pause