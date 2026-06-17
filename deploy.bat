@echo off

echo [1/4] Build...
call npm run build
if errorlevel 1 pause & exit /b 1

echo [2/4] Pack...
if exist fzblog-dist.tar.gz del fzblog-dist.tar.gz
tar -czf fzblog-dist.tar.gz -C dist .
if errorlevel 1 pause & exit /b 1

echo [3/4] Upload...
scp fzblog-dist.tar.gz jd:/tmp/fzblog-dist.tar.gz
if errorlevel 1 pause & exit /b 1

echo Cleaning local archive...
if exist fzblog-dist.tar.gz del fzblog-dist.tar.gz

echo [4/4] Deploy on server...
ssh jd "bash /opt/deploy-fzblog.sh"
if errorlevel 1 pause & exit /b 1

echo Done.
pause
