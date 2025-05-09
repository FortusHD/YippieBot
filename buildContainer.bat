@echo off
setlocal EnableDelayedExpansion

set c=0
set name=""
set version=""

for /f "tokens=1,2 delims=:, " %%a in (' find ":" ^< "package.json" ') do (
  if "%%~a"=="version" (
    set version=%%~b
  )
  if "%%~a"=="name" (
      set name=%%~b
    )
)

echo Running ESLint on the project...
call npm run lint
if errorlevel 1 (
  echo ESLint failed. Fix the issues before building the Docker container.
  exit /b 1
)
echo ESLint completed successfully. Proceeding...

echo Running tests...
call npm test
if errorlevel 1 (
  echo Tests failed. Fix the issues before building the Docker container.
  exit /b 1
)

echo Removing old file
IF EXIST container.tar (
    DEL /F container.tar
    if errorlevel 1 (
      echo Failed to remove old container file. Check permissions.
      exit /b 1
    )
)

echo Building new container with version %version%
call docker build -t fortus/%name%:%version% .
if errorlevel 1 (
  echo Docker build failed. Check the error output.
  exit /b 1
)

echo Exporting new container...
call docker save fortus/%name%:%version% -o container.tar
if errorlevel 1 (
  echo Failed to export the Docker container. Check for issues.
  exit /b 1
)

echo Done