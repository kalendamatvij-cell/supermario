@echo off
echo Компіляція Супер Маріо 2D (C++)...
g++ mario.cpp -o mario.exe -static-libgcc -static-libstdc++
if %errorlevel% equ 0 (
    echo Компіляція успішна!
    echo Запуск mario.exe...
    mario.exe
) else (
    echo Помилка компіляції!
    echo Переконайтеся що g++ встановлено та додано в PATH
    pause
)
