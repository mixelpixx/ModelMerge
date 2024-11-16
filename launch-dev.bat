// launch-dev.bat (for Windows development)
@echo off
echo Checking Python environment...

:: Check if Python is installed
python --version > nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python and try again
    pause
    exit /b 1
)

:: Check required Python packages
echo Checking Python packages...
python -c "import transformers, torch, mergekit, tqdm" > nul 2>&1
if errorlevel 1 (
    echo Installing required Python packages...
    pip install transformers torch mergekit tqdm
    if errorlevel 1 (
        echo Failed to install Python packages
        pause
        exit /b 1
    )
)

:: Start Next.js development server
echo Starting Next.js development server...
npm run dev