@echo off
echo ===========================================
echo       SAGE DASHBOARD AUTO DEPLOYMENT
echo ===========================================
echo [1/3] Staging all code changes...
git add .

echo [2/3] Creating automatic deployment commit...
set timestamp=%date:~10,4%-%date:~4,2%-%date:~7,2% %time:~0,8%
git commit -m "auto: deploy updates [%timestamp%]"

echo [3/3] Pushing to GitHub main branch for auto-deployment...
git push origin main

echo ===========================================
echo   SUCCESS! Deployed to live website.
echo ===========================================
pause
