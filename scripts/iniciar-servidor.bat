@echo off
rem Arranca Gamify en la red local. Lo lanza la tarea programada al iniciar
rem sesion en Windows; no hace falta tocarlo a mano.
rem
rem Si falta la compilacion de produccion (".next"), la genera antes de
rem arrancar: eso pasa la primera vez o si alguien la borro sin querer.
rem En el arranque normal se salta ese paso, asi el servidor esta listo en
rem segundos en vez de en un minuto largo.
cd /d "%~dp0.."
if not exist ".next" (
  call npm run build
)
call npm run start:lan
