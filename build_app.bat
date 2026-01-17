@echo off
echo ==========================================
echo      SnapProof Build Script (Robust)
echo ==========================================

echo [1/4] Setting environment variables...
set CSC_IDENTITY_AUTO_DISCOVERY=false
set NODE_OPTIONS=--max-old-space-size=4096

echo [2/4] Cleaning previous builds...
call npx rimraf dist release dist-electron

echo [3/4] Compiling Source Code...
call npm run build:main
if %errorlevel% neq 0 (
    echo [ERROR] Main process build failed!
    pause
    exit /b %errorlevel%
)

call npx vite build
if %errorlevel% neq 0 (
    echo [ERROR] Renderer process build failed!
    pause
    exit /b %errorlevel%
)

echo [4/4] Packaging Application (Unpacked Directory)...
echo This might take a while. Please disable antivirus if it gets stuck.
call npx electron-builder --win --dir -c.win.verifyUpdateCodeSignature=false

if %errorlevel% neq 0 (
    echo [ERROR] Packaging failed!
    echo Check logs above.
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo      BUILD SUCCESSFUL!
echo ==========================================
echo.
echo The application is ready at:
echo %CD%\release\win-unpacked\SnapProof.exe
echo.
pause
