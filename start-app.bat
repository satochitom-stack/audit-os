@echo off
chcp 65001 >nul
title Audit-OS (ระบบบริหารงานตรวจสอบภายใน อปท.)
echo ============================================================
echo   กำลังเริ่มต้น Audit-OS (ระบบสารสนเทศเพื่อการตรวจสอบภายใน อปท.)
echo   Local URL: http://localhost:5173
echo ============================================================
start "" http://localhost:5173
call npm.cmd run dev
pause
