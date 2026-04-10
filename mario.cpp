#include <iostream>
#include <vector>
#include <cmath>
#include <chrono>
#include <thread>
#include <conio.h>
#include <windows.h>

using namespace std;

// Константи
const int WIDTH = 80;
const int HEIGHT = 25;
const int GRAVITY = 1;
const int JUMP_FORCE = -3;
const int MOVE_SPEED = 1;

// Гравець
struct Player {
    int x = 10;
    int y = 20;
    int vx = 0;
    int vy = 0;
    int lives = 3;
    int score = 0;
    int coins = 0;
    bool onGround = true;
    bool isJumping = false;
};

// Платформа
struct Platform {
    int x;
    int y;
    int width;
    int height;
};

// Монета
struct Coin {
    int x;
    int y;
    bool collected = false;
};

// Ворог
struct Enemy {
    int x;
    int y;
    int vx = -1;
    bool alive = true;
};

// Глобальні змінні
Player mario;
vector<Platform> platforms;
vector<Coin> coins;
vector<Enemy> enemies;
bool gameRunning = false;
bool gameOver = false;

// Функції
void hideCursor() {
    HANDLE consoleHandle = GetStdHandle(STD_OUTPUT_HANDLE);
    CONSOLE_CURSOR_INFO cursorInfo;
    cursorInfo.dwSize = 1;
    cursorInfo.bVisible = FALSE;
    SetConsoleCursorInfo(consoleHandle, &cursorInfo);
}

void gotoXY(int x, int y) {
    COORD coord;
    coord.X = x;
    coord.Y = y;
    SetConsoleCursorPosition(GetStdHandle(STD_OUTPUT_HANDLE), coord);
}

void setColor(int color) {
    SetConsoleTextAttribute(GetStdHandle(STD_OUTPUT_HANDLE), color);
}

void generateLevel() {
    platforms.clear();
    coins.clear();
    enemies.clear();
    
    // Земля
    platforms.push_back({0, 22, 80, 3});
    
    // Платформи
    platforms.push_back({10, 18, 15, 1});
    platforms.push_back({30, 15, 15, 1});
    platforms.push_back({50, 12, 15, 1});
    platforms.push_back({20, 8, 10, 1});
    
    // Монети
    coins.push_back({15, 17});
    coins.push_back({35, 14});
    coins.push_back({55, 11});
    coins.push_back({23, 7});
    
    // Вороги
    enemies.push_back({25, 21});
    enemies.push_back({45, 21});
    enemies.push_back({65, 21});
    
    mario.x = 10;
    mario.y = 20;
    mario.vx = 0;
    mario.vy = 0;
    mario.onGround = true;
}

void draw() {
    system("cls");
    
    // Малюємо платформи
    setColor(6); // Коричневий
    for (auto& p : platforms) {
        for (int i = 0; i < p.width; i++) {
            gotoXY(p.x + i, p.y);
            cout << "=";
        }
    }
    
    // Малюємо монети
    setColor(14); // Жовтий
    for (auto& c : coins) {
        if (!c.collected) {
            gotoXY(c.x, c.y);
            cout << "O";
        }
    }
    
    // Малюємо ворогів
    setColor(4); // Червоний
    for (auto& e : enemies) {
        if (e.alive) {
            gotoXY(e.x, e.y);
            cout << "E";
        }
    }
    
    // Малюємо Маріо
    setColor(2); // Зелений
    gotoXY(mario.x, mario.y);
    cout << "M";
    
    // UI
    setColor(7); // Білий
    gotoXY(0, 0);
    cout << "Очки: " << mario.score << " Монети: " << mario.coins << " Життя: " << mario.lives;
    
    if (gameOver) {
        setColor(12); // Яскраво-червоний
        gotoXY(35, 12);
        cout << "GAME OVER";
        gotoXY(32, 13);
        cout << "Натисни R для рестарту";
    }
    
    setColor(7);
}

void update() {
    if (!gameRunning || gameOver) return;
    
    // Гравітація
    if (!mario.onGround) {
        mario.vy += GRAVITY;
    }
    
    // Рух
    mario.x += mario.vx;
    mario.y += mario.vy;
    
    // Колізія з платформами
    mario.onGround = false;
    for (auto& p : platforms) {
        if (mario.x >= p.x && mario.x < p.x + p.width &&
            mario.y >= p.y && mario.y < p.y + p.height) {
            if (mario.vy > 0) {
                mario.y = p.y - 1;
                mario.vy = 0;
                mario.onGround = true;
                mario.isJumping = false;
            }
        }
    }
    
    // Колізія з монетами
    for (auto& c : coins) {
        if (!c.collected && mario.x == c.x && mario.y == c.y) {
            c.collected = true;
            mario.coins++;
            mario.score += 50;
        }
    }
    
    // Рух ворогів
    for (auto& e : enemies) {
        if (!e.alive) continue;
        
        e.x += e.vx;
        
        // Зміна напрямку при досягненні краю
        if (e.x <= 5 || e.x >= 75) {
            e.vx *= -1;
        }
        
        // Колізія з гравцем
        if (e.alive && mario.x == e.x && mario.y == e.y) {
            if (mario.vy > 0) {
                e.alive = false;
                mario.vy = JUMP_FORCE;
                mario.score += 200;
            } else {
                mario.lives--;
                if (mario.lives <= 0) {
                    gameOver = true;
                } else {
                    mario.x = 10;
                    mario.y = 20;
                }
            }
        }
    }
    
    // Падіння за межі екрану
    if (mario.y >= HEIGHT) {
        mario.lives--;
        if (mario.lives <= 0) {
            gameOver = true;
        } else {
            mario.x = 10;
            mario.y = 20;
        }
    }
    
    // Межі екрану
    if (mario.x < 0) mario.x = 0;
    if (mario.x >= WIDTH) mario.x = WIDTH - 1;
}

void startGame() {
    mario.lives = 3;
    mario.score = 0;
    mario.coins = 0;
    gameOver = false;
    gameRunning = true;
    generateLevel();
}

int main() {
    hideCursor();
    setColor(7);
    
    cout << "=== СУПЕР МАРІО 2D (C++) ===" << endl;
    cout << "Керування:" << endl;
    cout << "A/D - Рух вліво/вправо" << endl;
    cout << "W або Space - Стрибок" << endl;
    cout << "R - Рестарт" << endl;
    cout << "Q - Вихід" << endl;
    cout << "Натисни будь-яку клавішу для початку..." << endl;
    _getch();
    
    startGame();
    
    while (true) {
        if (_kbhit()) {
            char key = _getch();
            
            switch (key) {
                case 'a':
                case 'A':
                    mario.vx = -MOVE_SPEED;
                    break;
                case 'd':
                case 'D':
                    mario.vx = MOVE_SPEED;
                    break;
                case 'w':
                case 'W':
                case ' ':
                    if (mario.onGround) {
                        mario.vy = JUMP_FORCE;
                        mario.onGround = false;
                        mario.isJumping = true;
                    }
                    break;
                case 'r':
                case 'R':
                    startGame();
                    break;
                case 'q':
                case 'Q':
                    return 0;
            }
        }
        
        update();
        draw();
        
        this_thread::sleep_for(chrono::milliseconds(50));
    }
    
    return 0;
}
