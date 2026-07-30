@echo off
REM ============================================================================
REM  Finance Atlas - serve the built site with the zero-dependency Node server.
REM  Requires the site to be built first (tools\build.cmd) and Node installed.
REM
REM  Usage:
REM    tools\serve.cmd              serve site\ on http://localhost:8080
REM    tools\serve.cmd 3000         serve on port 3000
REM    tools\serve.cmd --dir foo    serve a different folder
REM ============================================================================
where node >nul 2>&1 || (echo Node.js not found on PATH. Install it from https://nodejs.org & exit /b 1)
node "%~dp0serve.mjs" %*
exit /b %ERRORLEVEL%
