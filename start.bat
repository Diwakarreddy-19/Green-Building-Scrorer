@echo off
title Green Building Certification Scorer
echo ===================================================
echo   Green Building Certification Scorer (GreenScore)
echo ===================================================
echo.
echo Starting Spring Boot server on http://localhost:8080 ...
echo Press Ctrl+C in this window to stop the server.
echo.
java -jar "%~dp0target\green-building-scorer-1.0.0.jar"
pause
