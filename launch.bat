@echo off
chcp 65001 >nul
title Audit-OS
start "" http://localhost:5173
call npm.cmd run dev
exit
