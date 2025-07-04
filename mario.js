// 超级玛丽doro版主逻辑
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const TILE = 48;
const GRAVITY = 1.2;
const JUMP_V = -20;
const MOVE_V = 7;
const doroImg = new Image();
doroImg.src = 'doro.png';
const LEVEL = [
    '                                                                ',
    '                                                                ',
    '                                                                ',
    '                                                                ',
    '           o        o                                           ',
    '   #######    #######                                           ',
    '           P                                                    ',
    '           #                                                    ',
    '      o        o      E         o      o      o      o     F    ',
    '##########   ########   ###########   ####   ####   ####   #####',
];
// 说明：P=主角起点，#=地面/平台，o=橘子，E=敌人，F=终点旗帜

let player = {
    x: 0, y: 0, vx: 0, vy: 0, w: 36, h: 48, onGround: false, alive: true, win: false, coins: 0, frame: 0
};
let enemies = [];
let coins = [];
let flag = {x: 0, y: 0};
let keys = {};
let gameState = 'playing';

// 卷轴参数
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;
let cameraX = 0;

let showPlant = false;
let plantScale = 0.1;
const plantImg = new Image();
plantImg.src = 'newplant.png';

const PLANT_MAX_W = 400;
const PLANT_MAX_H = 400;

function resetLevel() {
    enemies = [];
    coins = [];
    for (let r = 0; r < LEVEL.length; r++) {
        for (let c = 0; c < LEVEL[r].length; c++) {
            let ch = LEVEL[r][c];
            if (ch === 'P') {
                player.x = c * TILE;
                player.y = r * TILE;
                player.vx = 0;
                player.vy = 0;
                player.alive = true;
                player.win = false;
                player.coins = 0;
            } else if (ch === 'E') {
                enemies.push({x: c * TILE, y: r * TILE, w: 36, h: 48, dir: 1, vx: 2});
            } else if (ch === 'o') {
                coins.push({x: c * TILE + 12, y: r * TILE + 12, r: 12, collected: false});
            } else if (ch === 'F') {
                flag.x = c * TILE;
                flag.y = r * TILE;
            }
        }
    }
    cameraX = 0;
}

resetLevel();

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

document.getElementById('musicBtn').onclick = function() {
    let bgm = document.getElementById('bgm');
    if (bgm.paused) bgm.play(); else bgm.pause();
};

function playSound(id) {
    let snd = document.getElementById(id);
    if (snd) { snd.currentTime = 0; snd.play(); }
}

function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
    if (!player.alive || player.win) return;
    // 左右移动
    if (keys['ArrowLeft'] || keys['a']) player.vx = -MOVE_V;
    else if (keys['ArrowRight'] || keys['d']) player.vx = MOVE_V;
    else player.vx = 0;
    // 跳跃
    if ((keys['ArrowUp'] || keys['w'] || keys[' ']) && player.onGround) {
        player.vy = JUMP_V;
        player.onGround = false;
        playSound('jumpSound');
    }
    // 重力
    player.vy += GRAVITY;
    // 水平移动
    player.x += player.vx;
    // 水平碰撞
    for (let r = 0; r < LEVEL.length; r++) {
        for (let c = 0; c < LEVEL[r].length; c++) {
            if (LEVEL[r][c] === '#') {
                let block = {x: c*TILE, y: r*TILE, w: TILE, h: TILE};
                if (rectCollide(player, block)) {
                    if (player.vx > 0) player.x = block.x - player.w;
                    else if (player.vx < 0) player.x = block.x + block.w;
                }
            }
        }
    }
    // 垂直移动
    player.y += player.vy;
    player.onGround = false;
    for (let r = 0; r < LEVEL.length; r++) {
        for (let c = 0; c < LEVEL[r].length; c++) {
            if (LEVEL[r][c] === '#') {
                let block = {x: c*TILE, y: r*TILE, w: TILE, h: TILE};
                if (rectCollide(player, block)) {
                    if (player.vy > 0) {
                        player.y = block.y - player.h;
                        player.vy = 0;
                        player.onGround = true;
                    } else if (player.vy < 0) {
                        player.y = block.y + block.h;
                        player.vy = 0;
                    }
                }
            }
        }
    }
    // 掉落死亡
    if (player.y > canvas.height) {
        player.alive = false;
        playSound('dieSound');
        setTimeout(resetLevel, 1500);
    }
    // 吃金币
    for (let coin of coins) {
        if (!coin.collected && Math.abs(player.x + player.w/2 - coin.x) < 24 && Math.abs(player.y + player.h/2 - coin.y) < 24) {
            coin.collected = true;
            player.coins++;
            playSound('coinSound');
        }
    }
    // 敌人移动和碰撞
    for (let enemy of enemies) {
        enemy.x += enemy.vx * enemy.dir;
        // 碰撞平台反向
        let hit = false;
        for (let r = 0; r < LEVEL.length; r++) {
            for (let c = 0; c < LEVEL[r].length; c++) {
                if (LEVEL[r][c] === '#') {
                    let block = {x: c*TILE, y: r*TILE, w: TILE, h: TILE};
                    if (rectCollide(enemy, block)) {
                        hit = true;
                    }
                }
            }
        }
        if (hit) enemy.dir *= -1;
        // 被踩死
        if (rectCollide(player, enemy) && player.vy > 0) {
            enemy.x = -9999; // 移除
            player.vy = JUMP_V/1.5;
            playSound('coinSound');
        } else if (rectCollide(player, enemy)) {
            player.alive = false;
            playSound('dieSound');
            setTimeout(resetLevel, 1500);
        }
    }
    // 到达终点
    if (Math.abs(player.x - flag.x) < 32 && Math.abs(player.y - flag.y) < 48) {
        player.win = true;
        playSound('winSound');
        showPlant = true;
        plantScale = 0.1;
        // 不再自动resetLevel
    }
    // 卷轴跟随主角
    cameraX = player.x + player.w/2 - VIEW_W/2;
    cameraX = Math.max(0, Math.min(cameraX, LEVEL[0].length*TILE - VIEW_W));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 平台
    for (let r = 0; r < LEVEL.length; r++) {
        for (let c = 0; c < LEVEL[r].length; c++) {
            if (LEVEL[r][c] === '#') {
                ctx.fillStyle = '#654321';
                ctx.fillRect(c*TILE - cameraX, r*TILE, TILE, TILE);
            }
        }
    }
    // 橘子
    for (let coin of coins) {
        if (!coin.collected) {
            ctx.beginPath();
            ctx.arc(coin.x - cameraX, coin.y, coin.r, 0, Math.PI*2);
            ctx.fillStyle = 'orange';
            ctx.fill();
            ctx.save();
            ctx.translate(coin.x - cameraX, coin.y - coin.r + 4);
            ctx.rotate(-0.3);
            ctx.fillStyle = '#3c5';
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 3, 0, 0, Math.PI*2);
            ctx.fill();
            ctx.restore();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }
    }
    // 敌人
    for (let enemy of enemies) {
        ctx.fillStyle = '#c33';
        ctx.fillRect(enemy.x - cameraX, enemy.y, enemy.w, enemy.h);
        ctx.fillStyle = '#fff';
        ctx.fillRect(enemy.x+8 - cameraX, enemy.y+8, 8, 8); // 眼睛
        ctx.fillRect(enemy.x+20 - cameraX, enemy.y+8, 8, 8);
    }
    // 主角doro图片
    if (doroImg.complete && doroImg.naturalWidth > 0) {
        ctx.drawImage(doroImg, player.x + player.w/2 - cameraX - player.w/2, player.y + player.h/2 - player.h/2, player.w, player.h);
    } else {
        // 占位像素画
        ctx.save();
        ctx.translate(player.x+player.w/2 - cameraX, player.y+player.h/2);
        ctx.fillStyle = '#fbeee6';
        ctx.fillRect(-player.w/2, -player.h/2, player.w, player.h);
        ctx.restore();
    }
    // 终点旗帜
    ctx.fillStyle = '#0c0';
    ctx.fillRect(flag.x - cameraX, flag.y, 12, 48);
    ctx.fillStyle = '#fff';
    ctx.fillRect(flag.x+12 - cameraX, flag.y, 24, 16);
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('橘子: ' + player.coins, 20, 30);
    if (!player.alive) ctx.fillText('你死了！', canvas.width/2-60, canvas.height/2);
    if (player.win) {
        ctx.fillStyle = '#fff';
        ctx.font = '32px Arial';
        ctx.fillText('通关成功！', canvas.width/2-80, canvas.height/2-80);
        // 渐变展示新植物
        if (showPlant && plantImg.complete && plantImg.naturalWidth > 0) {
            plantScale += 0.02;
            if (plantScale > 1) plantScale = 1;
            // 保持图片宽高比，最大不超过200x200
            let ratio = Math.min(PLANT_MAX_W/plantImg.width, PLANT_MAX_H/plantImg.height, 1);
            let pw = plantImg.width * ratio * plantScale;
            let ph = plantImg.height * ratio * plantScale;
            ctx.save();
            ctx.globalAlpha = plantScale;
            ctx.drawImage(plantImg, canvas.width/2 - pw/2, canvas.height/2 - ph/2, pw, ph);
            ctx.restore();
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop(); 