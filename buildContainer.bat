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

echo Removing old file
IF EXIST container.tar DEL /F container.tar

echo Building new container with version %version%
docker build -t fortus/%name%:%version% .
echo Exporting new container...
docker save fortus/%name%:%version% -o container.tar
echo Done