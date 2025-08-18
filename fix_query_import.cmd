@echo off
echo Adding missing query import to projectWizardController.js...

REM Create a temporary file with the import added
(
echo const rateLimit = require('express-rate-limit'^);
echo const { 
echo   validateWizardData, 
echo   validateBasicProjectInfo, 
echo   formatValidationErrors,
echo   ValidationError 
echo } = require('../utils/validation'^);
echo.
echo // ADDED: Missing database query import
echo const { query } = require('../config/database'^);
echo.
) > temp_header.txt

REM Skip the first few lines of the original file and append the rest
powershell -Command "(Get-Content 'backend\controllers\projectWizardController.js' | Select-Object -Skip 8) | Add-Content 'temp_header.txt'"

REM Replace the original file
move temp_header.txt backend\controllers\projectWizardController.js

echo Import added successfully!
echo Restarting Docker services...

docker-compose -f docker/docker-compose.dev.yml restart backend

echo Done! Try the wizard again.
pause

