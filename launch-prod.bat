// launch-prod.bat (for Windows production)
@echo off
echo Building and starting production server...

:: Check Python environment
python --version > nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    pause
    exit /b 1
)

:: Check required Python packages
python -c "import transformers, torch, mergekit, tqdm" > nul 2>&1
if errorlevel 1 (
    echo Installing required Python packages...
    pip install transformers torch mergekit tqdm
)

:: Build and start Next.js production server
echo Building Next.js application...
npm run build
if errorlevel 1 (
    echo Build failed
    pause
    exit /b 1
)

echo Starting production server...
npm start