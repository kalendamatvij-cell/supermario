const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Resize canvas for mobile devices
function resizeCanvas() {
    if (window.innerWidth <= 768) {
        const aspectRatio = 800 / 600;
        const maxWidth = window.innerWidth - 40;
        const maxHeight = window.innerHeight - 200;
        
        let newWidth = maxWidth;
        let newHeight = newWidth / aspectRatio;
        
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = newHeight * aspectRatio;
        }
        
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const GRAVITY = 0.4;
const JUMP_FORCE = -10;
const MOVE_SPEED = 1.5;
const SPRINT_SPEED = 2.5;
const GROUND_Y = 550;
const MAX_LEVELS = 10;

let mario = {
    x: 100,
    y: GROUND_Y + 100 - 24,
    width: 24,
    height: 24,
    vx: 0,
    vy: 0,
    onGround: true,
    isJumping: false,
    isSprinting: false,
    facingRight: true,
    lives: 3,
    score: 0,
    coins: 0,
    level: 1,
    invincible: false,
    invincibleTimer: 0
};

const keys = {};

let platforms = [];
let coins = [];
let enemies = [];
let blocks = [];
let pipes = [];
let flag = null;

let gameRunning = false;
let gameOver = false;

let cameraX = 0;
let cameraY = 0;

function updateCamera() {
    cameraX = mario.x - canvas.width / 2;
    cameraY = mario.y - canvas.height / 2;
    
    cameraX = Math.max(0, cameraX);
    cameraY = Math.max(0, cameraY);
}

function generateLevel(levelNum) {
    platforms = [];
    coins = [];
    enemies = [];
    blocks = [];
    pipes = [];
    flag = null;
    
    const yOffset = 100; // Зсув вниз
    const worldWidth = 2000; // Ширина світу
    
    platforms.push({ x: 0, y: GROUND_Y + yOffset, width: worldWidth, height: 50, type: 'ground' });
    
    const platformCount = 5 + levelNum * 2;
    
    for (let i = 0; i < platformCount; i++) {
        let x = 100 + i * 150;
        let y = GROUND_Y - 100 - Math.random() * 150 + yOffset;
        let width = 80 + Math.random() * 60;
        
        platforms.push({
            x: x,
            y: y,
            width: width,
            height: 10,
            type: 'brick'
        });
        
        if (Math.random() > 0.3) {
            coins.push({
                x: x + width / 2 - 6,
                y: y - 20,
                width: 12,
                height: 12,
                collected: false
            });
        }
    }
    
    for (let i = 0; i < 3 + levelNum; i++) {
        blocks.push({
            x: 200 + i * 200,
            y: GROUND_Y - 150 + yOffset,
            width: 28,
            height: 28,
            type: 'question',
            hit: false,
            content: Math.random() > 0.5 ? 'coin' : 'mushroom'
        });
    }
    
    for (let i = 0; i < 2 + levelNum; i++) {
        let pipeHeight = 40 + Math.random() * 20;
        pipes.push({
            x: 300 + i * 250,
            y: GROUND_Y + yOffset - pipeHeight,
            width: 32,
            height: pipeHeight
        });
    }
    
    const enemyCount = 3 + levelNum;
    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: 200 + i * 150,
            y: GROUND_Y + yOffset - 20,
            width: 20,
            height: 20,
            vx: -1 - levelNum * 0.2,
            type: Math.random() > 0.7 ? 'koopa' : 'goomba',
            alive: true
        });
    }
    
    for (let i = 0; i < 5 + levelNum * 2; i++) {
        coins.push({
            x: 150 + i * 120,
            y: GROUND_Y - 200 - Math.random() * 100 + yOffset,
            width: 12,
            height: 12,
            collected: false
        });
    }
    
    flag = {
        x: 1900,
        y: GROUND_Y - 120 + yOffset,
        width: 12,
        height: 120
    };
}

function drawMario() {
    ctx.save();
    
    if (mario.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5;
    }
    
    let x = mario.x - cameraX;
    let y = mario.y - cameraY;
    
    // Тулуб (синій комбінезон)
    ctx.fillStyle = '#0055a4';
    ctx.fillRect(x + 8, y + 12, 16, 10);
    
    // Ноги
    ctx.fillStyle = '#0055a4';
    ctx.fillRect(x + 8, y + 20, 6, 6);
    ctx.fillRect(x + 16, y + 20, 6, 6);
    
    // Взуття
    ctx.fillStyle = '#8b4513';
    ctx.fillRect(x + 6, y + 24, 8, 4);
    ctx.fillRect(x + 16, y + 24, 8, 4);
    
    // Голова (шкіра)
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(x + 8, y, 14, 14);
    
    // Капелюшок (червоний)
    ctx.fillStyle = '#e52521';
    ctx.fillRect(x + 6, y - 2, 16, 6);
    ctx.fillRect(x + 4, y, 20, 4);
    
    // Вуса
    ctx.fillStyle = '#4a2c0a';
    ctx.fillRect(x + 10, y + 10, 6, 2);
    ctx.fillRect(x + 16, y + 10, 6, 2);
    
    // Очі
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 11, y + 4, 2, 2);
    ctx.fillRect(x + 17, y + 4, 2, 2);
    
    // Руки
    ctx.fillStyle = '#ffdbac';
    ctx.fillRect(x + 4, y + 12, 4, 8);
    ctx.fillRect(x + 22, y + 12, 4, 8);
    
    // Рукави (сині)
    ctx.fillStyle = '#0055a4';
    ctx.fillRect(x + 2, y + 12, 4, 6);
    ctx.fillRect(x + 22, y + 12, 4, 6);
    
    ctx.restore();
}

function drawEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        const screenX = enemy.x - cameraX;
        const screenY = enemy.y - cameraY;
        
        if (screenX + enemy.width < 0 || screenX > canvas.width ||
            screenY + enemy.height < 0 || screenY > canvas.height) {
            return;
        }
        
        if (enemy.type === 'goomba') {
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.ellipse(screenX + enemy.width/2, screenY + enemy.height/2, 
                       enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.fillRect(screenX + 5, screenY + 5, 8, 8);
            ctx.fillRect(screenX + 17, screenY + 5, 8, 8);
            ctx.fillStyle = 'black';
            ctx.fillRect(screenX + 7, screenY + 7, 4, 4);
            ctx.fillRect(screenX + 19, screenY + 7, 4, 4);
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(screenX + 2, screenY + enemy.height - 8, 10, 8);
            ctx.fillRect(screenX + enemy.width - 12, screenY + enemy.height - 8, 10, 8);
        } else if (enemy.type === 'koopa') {
            ctx.fillStyle = '#228b22';
            ctx.beginPath();
            ctx.ellipse(screenX + enemy.width/2, screenY + enemy.height/2, 
                       enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#90ee90';
            ctx.fillRect(screenX + 5, screenY + 10, enemy.width - 10, enemy.height - 15);
            
            ctx.fillStyle = '#228b22';
            ctx.beginPath();
            ctx.arc(screenX + enemy.width/2, screenY + 5, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.fillRect(screenX + 8, screenY + 2, 6, 6);
            ctx.fillRect(screenX + 16, screenY + 2, 6, 6);
        }
    });
}

function drawPlatforms() {
    platforms.forEach(platform => {
        const screenX = platform.x - cameraX;
        const screenY = platform.y - cameraY;
        
        // Не малювати якщо за межами екрану
        if (screenX + platform.width < 0 || screenX > canvas.width ||
            screenY + platform.height < 0 || screenY > canvas.height) {
            return;
        }
        
        if (platform.type === 'ground') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(screenX, screenY, platform.width, platform.height);
            ctx.fillStyle = '#228b22';
            ctx.fillRect(screenX, screenY, platform.width, 10);
        } else {
            ctx.fillStyle = '#cd853f';
            ctx.fillRect(screenX, screenY, platform.width, platform.height);
            
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            for (let i = 0; i < platform.width; i += 20) {
                ctx.strokeRect(screenX + i, screenY, 20, platform.height);
            }
        }
    });
}

function drawBlocks() {
    blocks.forEach(block => {
        const screenX = block.x - cameraX;
        const screenY = block.y - cameraY;
        
        if (screenX + block.width < 0 || screenX > canvas.width ||
            screenY + block.height < 0 || screenY > canvas.height) {
            return;
        }
        
        if (block.type === 'question') {
            if (block.hit) {
                ctx.fillStyle = '#cd853f';
                ctx.fillRect(screenX, screenY, block.width, block.height);
            } else {
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(screenX, screenY, block.width, block.height);
                ctx.fillStyle = '#000';
                ctx.font = 'bold 24px Arial';
                ctx.fillText('?', screenX + 12, screenY + 28);
            }
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX, screenY, block.width, block.height);
        }
    });
}

function drawPipes() {
    pipes.forEach(pipe => {
        const screenX = pipe.x - cameraX;
        const screenY = pipe.y - cameraY;
        
        if (screenX + pipe.width < 0 || screenX > canvas.width ||
            screenY + pipe.height < 0 || screenY > canvas.height) {
            return;
        }
        
        ctx.fillStyle = '#228b22';
        ctx.fillRect(screenX, screenY, pipe.width, pipe.height);
        
        ctx.fillStyle = '#90ee90';
        ctx.fillRect(screenX - 5, screenY, pipe.width + 10, 20);
        
        ctx.strokeStyle = '#006400';
        ctx.lineWidth = 3;
        ctx.strokeRect(screenX, screenY, pipe.width, pipe.height);
        ctx.strokeRect(screenX - 5, screenY, pipe.width + 10, 20);
    });
}

function drawCoins() {
    coins.forEach(coin => {
        if (coin.collected) return;
        
        const screenX = coin.x - cameraX;
        const screenY = coin.y - cameraY;
        
        if (screenX + coin.width < 0 || screenX > canvas.width ||
            screenY + coin.height < 0 || screenY > canvas.height) {
            return;
        }
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(screenX + coin.width/2, screenY + coin.height/2, 
                   coin.width/2, coin.height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffec8b';
        ctx.beginPath();
        ctx.ellipse(screenX + coin.width/2 - 3, screenY + coin.height/2 - 3, 
                   coin.width/4, coin.height/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(screenX + coin.width/2, screenY + coin.height/2, 
                   coin.width/2, coin.height/2, 0, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawFlag() {
    if (!flag) return;
    
    const screenX = flag.x - cameraX;
    const screenY = flag.y - cameraY;
    
    if (screenX + flag.width < 0 || screenX > canvas.width ||
        screenY + flag.height < 0 || screenY > canvas.height) {
        return;
    }
    
    ctx.fillStyle = '#228b22';
    ctx.fillRect(screenX, screenY, flag.width, flag.height);
    
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(screenX + flag.width/2, screenY, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#e52521';
    ctx.beginPath();
    ctx.moveTo(screenX + flag.width, screenY + 20);
    ctx.lineTo(screenX + flag.width + 50, screenY + 40);
    ctx.lineTo(screenX + flag.width, screenY + 60);
    ctx.closePath();
    ctx.fill();
}

function update() {
    if (!gameRunning || gameOver) return;
    
    updateCamera();
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        mario.vx = mario.isSprinting ? -SPRINT_SPEED : -MOVE_SPEED;
        mario.facingRight = false;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        mario.vx = mario.isSprinting ? SPRINT_SPEED : MOVE_SPEED;
        mario.facingRight = true;
    } else {
        mario.vx = 0;
    }
    
    mario.isSprinting = keys['Shift'];
    
    if ((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && mario.onGround) {
        mario.vy = JUMP_FORCE;
        mario.onGround = false;
        mario.isJumping = true;
    }
    
    mario.vy += GRAVITY;
    
    mario.x += mario.vx;
    mario.y += mario.vy;
    
    mario.onGround = false;
    platforms.forEach(platform => {
        if (mario.x < platform.x + platform.width &&
            mario.x + mario.width > platform.x &&
            mario.y + mario.height > platform.y &&
            mario.y + mario.height < platform.y + platform.height + mario.vy + 5) {
            if (mario.vy > 0) {
                mario.y = platform.y - mario.height;
                mario.vy = 0;
                mario.onGround = true;
                mario.isJumping = false;
            }
        }
    });
    
    blocks.forEach(block => {
        if (mario.x < block.x + block.width &&
            mario.x + mario.width > block.x &&
            mario.y < block.y + block.height &&
            mario.y + mario.height > block.y) {
            
            if (mario.vy > 0 && mario.y + mario.height < block.y + block.height / 2) {
                mario.y = block.y - mario.height;
                mario.vy = 0;
                mario.onGround = true;
            } else if (mario.vy < 0 && !block.hit) {
                mario.vy = 0;
                block.hit = true;
                if (block.content === 'coin') {
                    mario.coins++;
                    mario.score += 100;
                } else if (block.content === 'mushroom') {
                    mario.lives++;
                    mario.score += 500;
                }
            } else if (mario.vx > 0) {
                mario.x = block.x - mario.width;
            } else if (mario.vx < 0) {
                mario.x = block.x + block.width;
            }
        }
    });
    
    pipes.forEach(pipe => {
        if (mario.x < pipe.x + pipe.width &&
            mario.x + mario.width > pipe.x &&
            mario.y + mario.height > pipe.y &&
            mario.y < pipe.y + pipe.height) {
            
            if (mario.vy > 0 && mario.y + mario.height < pipe.y + pipe.height / 2) {
                mario.y = pipe.y - mario.height;
                mario.vy = 0;
                mario.onGround = true;
            } else if (mario.vx > 0) {
                mario.x = pipe.x - mario.width;
            } else if (mario.vx < 0) {
                mario.x = pipe.x + pipe.width;
            }
        }
    });
    
    coins.forEach(coin => {
        if (coin.collected) return;
        if (mario.x < coin.x + coin.width &&
            mario.x + mario.width > coin.x &&
            mario.y < coin.y + coin.height &&
            mario.y + mario.height > coin.y) {
            coin.collected = true;
            mario.coins++;
            mario.score += 50;
        }
    });
    
    enemies.forEach(enemy => {
        if (!enemy.alive) return;
        
        enemy.x += enemy.vx;
        enemy.vy = (enemy.vy || 0) + GRAVITY;
        enemy.y += enemy.vy;
        
        platforms.forEach(platform => {
            if (enemy.x < platform.x + platform.width &&
                enemy.x + enemy.width > platform.x &&
                enemy.y + enemy.height > platform.y &&
                enemy.y + enemy.height < platform.y + platform.height + enemy.vy + 5) {
                if (enemy.vy > 0) {
                    enemy.y = platform.y - enemy.height;
                    enemy.vy = 0;
                }
            }
        });
        
        if (!enemy.startX) {
            enemy.startX = enemy.x;
        }
        
        if (enemy.vx > 0 && enemy.x > enemy.startX + 200) {
            enemy.vx *= -1;
        } else if (enemy.vx < 0 && enemy.x < enemy.startX - 200) {
            enemy.vx *= -1;
        }
        
        if (enemy.x < 0 || enemy.x > 2000) {
            enemy.vx *= -1;
        }
        
        blocks.forEach(block => {
            if (enemy.x < block.x + block.width &&
                enemy.x + enemy.width > block.x &&
                enemy.y < block.y + block.height &&
                enemy.y + enemy.height > block.y) {
                if (enemy.vx > 0) {
                    enemy.x = block.x - enemy.width;
                } else if (enemy.vx < 0) {
                    enemy.x = block.x + block.width;
                }
                enemy.vx *= -1;
            }
        });
        
        pipes.forEach(pipe => {
            if (enemy.x < pipe.x + pipe.width &&
                enemy.x + enemy.width > pipe.x &&
                enemy.y < pipe.y + pipe.height &&
                enemy.y + enemy.height > pipe.y) {
                if (enemy.vx > 0) {
                    enemy.x = pipe.x - enemy.width;
                } else if (enemy.vx < 0) {
                    enemy.x = pipe.x + pipe.width;
                }
                enemy.vx *= -1;
            }
        });
        
        if (mario.x < enemy.x + enemy.width &&
            mario.x + mario.width > enemy.x &&
            mario.y < enemy.y + enemy.height &&
            mario.y + mario.height > enemy.y) {
            
            if (mario.vy > 0 && mario.y + mario.height < enemy.y + enemy.height / 2) {
                enemy.alive = false;
                mario.vy = -8;
                mario.score += 200;
            } else if (!mario.invincible) {
                mario.lives--;
                mario.invincible = true;
                mario.invincibleTimer = 60;
                
                if (mario.lives <= 0) {
                    endGame();
                }
            }
        }
    });
    
    if (mario.invincible) {
        mario.invincibleTimer--;
        if (mario.invincibleTimer <= 0) {
            mario.invincible = false;
        }
    }
    
    if (mario.y > canvas.height + 100) {
        mario.lives--;
        if (mario.lives <= 0) {
            endGame();
        } else {
            resetMario();
        }
    }
    
    if (flag && mario.x > flag.x) {
        nextLevel();
    }
    
    if (mario.x < 0) mario.x = 0;
    if (mario.x > 2000 - mario.width) mario.x = 2000 - mario.width;
}

function resetMario() {
    mario.x = 100;
    mario.y = GROUND_Y + 100 - 24;
    mario.vx = 0;
    mario.vy = 0;
    mario.invincible = true;
    mario.invincibleTimer = 60;
}

function nextLevel() {
    if (mario.level >= MAX_LEVELS) {
        endGame();
        return;
    }
    mario.level++;
    mario.score += 1000;
    generateLevel(mario.level);
    resetMario();
}

function endGame() {
    gameOver = true;
    gameRunning = false;
    document.getElementById('gameOverText').textContent = mario.lives <= 0 ? 'Гра закінчена!' : 'Вітаємо! Продовження скоро вийде!';
    document.getElementById('finalScore').textContent = mario.score;
    document.getElementById('gameOver').style.display = 'block';
}

function drawBackground() {
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(100 - cameraX * 0.3, 100 - cameraY * 0.1, 40, 0, Math.PI * 2);
    ctx.arc(150 - cameraX * 0.3, 100 - cameraY * 0.1, 50, 0, Math.PI * 2);
    ctx.arc(200 - cameraX * 0.3, 100 - cameraY * 0.1, 40, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(600 - cameraX * 0.3, 150 - cameraY * 0.1, 35, 0, Math.PI * 2);
    ctx.arc(650 - cameraX * 0.3, 150 - cameraY * 0.1, 45, 0, Math.PI * 2);
    ctx.arc(700 - cameraX * 0.3, 150 - cameraY * 0.1, 35, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    drawBackground();
    drawPlatforms();
    drawBlocks();
    drawPipes();
    drawCoins();
    drawEnemies();
    drawFlag();
    drawMario();
    
    document.getElementById('score').textContent = mario.score;
    document.getElementById('coins').textContent = mario.coins;
    document.getElementById('lives').textContent = mario.lives;
    document.getElementById('level').textContent = mario.level;
    document.getElementById('maxLevel').textContent = MAX_LEVELS;
}

function gameLoop() {
    if (gameRunning) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

function startGame() {
    mario = {
        x: 100,
        y: GROUND_Y + 100 - 24,
        width: 24,
        height: 24,
        vx: 0,
        vy: 0,
        onGround: true,
        isJumping: false,
        isSprinting: false,
        facingRight: true,
        lives: 3,
        score: 0,
        coins: 0,
        level: 1,
        invincible: false,
        invincibleTimer: 0
    };
    
    generateLevel(1);
    gameRunning = true;
    gameOver = false;
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
}

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
});

document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Touch controls for mobile
const touchButtons = document.querySelectorAll('.touch-btn, .action-btn');

touchButtons.forEach(btn => {
    const key = btn.dataset.key;
    
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[key] = true;
        if (key === ' ') keys['Space'] = true;
    });
    
    btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[key] = false;
        if (key === ' ') keys['Space'] = false;
    });
    
    btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        keys[key] = false;
        if (key === ' ') keys['Space'] = false;
    });
});

// Prevent default touch behavior on the game area
document.getElementById('game').addEventListener('touchstart', (e) => {
    e.preventDefault();
}, { passive: false });

gameLoop();
