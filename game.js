// ============================================================
// Flappy Bird Clone — Vanilla HTML5 Canvas
// ============================================================

(() => {
  "use strict";

  // ----------------------------------------------------------
  // Canvas setup
  // ----------------------------------------------------------
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const GAME_WIDTH = 400;
  const GAME_HEIGHT = 600;
  canvas.width = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;

  // ----------------------------------------------------------
  // Constants
  // ----------------------------------------------------------
  const GRAVITY = 0.45;
  const FLAP_STRENGTH = -7.5;
  const BIRD_X = 80;
  const BIRD_RADIUS = 15;

  const PIPE_WIDTH = 55;
  const PIPE_SPAWN_INTERVAL = 1600; // ms between pipe spawns
  const PIPE_SPEED_BASE = 2.5;
  const PIPE_SPEED_INCREMENT = 0.08; // per 5 points

  const GAP_SIZE_BASE = 150;
  const GAP_SIZE_MIN = 100;
  const GAP_SHRINK_PER_5 = 4; // gap shrinks by this every 5 pts

  const GROUND_HEIGHT = 60;
  const GROUND_Y = GAME_HEIGHT - GROUND_HEIGHT;

  // Combat constants
  const PLAYER_MAX_HEALTH = 3;
  const BULLET_SPEED = 12;
  const BULLET_RADIUS = 5;
  const BULLET_COOLDOWN = 200; // ms between shots
  
  const ENEMY_SPAWN_INTERVAL = 3000; // ms between enemy spawns
  const ENEMY_SPEED_BASE = 1.5;
  const ENEMY_BULLET_SPEED = 4;
  const ENEMY_FIRE_INTERVAL = 1500; // ms between enemy shots
  const ENEMY_RADIUS = 12;
  
  const POWERUP_SPAWN_INTERVAL = 8000; // ms between powerup spawns
  const POWERUP_RADIUS = 10;
  const INVINCIBILITY_DURATION = 3000; // ms
  const MULTISHOT_DURATION = 5000; // ms
  const SCORE_MULTIPLIER_DURATION = 10000; // ms
  const INVINCIBILITY_FLASH_INTERVAL = 150; // ms between flashes

  // Colors
  const COLOR_SKY_TOP = "#4ec0ca";
  const COLOR_SKY_BOTTOM = "#71c8d6";
  const COLOR_GROUND = "#ded895";
  const COLOR_GROUND_DARK = "#d2c56e";
  const COLOR_PIPE = "#73bf2e";
  const COLOR_PIPE_DARK = "#558b1f";
  const COLOR_PIPE_CAP = "#5ea922";
  const COLOR_BIRD_BODY = "#f5c842";
  const COLOR_BIRD_BELLY = "#f7e076";
  const COLOR_BIRD_WING = "#e6a817";
  const COLOR_BIRD_BEAK = "#e8572a";
  const COLOR_BIRD_EYE_WHITE = "#ffffff";
  const COLOR_BIRD_EYE_PUPIL = "#333333";
  
  // Combat colors
  const COLOR_PLAYER_BULLET = "#ffff00";
  const COLOR_ENEMY = "#e74c3c";
  const COLOR_ENEMY_BULLET = "#ff6b6b";
  const COLOR_HEALTH_FULL = "#2ecc71";
  const COLOR_HEALTH_EMPTY = "#95a5a6";
  const COLOR_POWERUP_INVINCIBILITY = "#9b59b6";
  const COLOR_POWERUP_MULTISHOT = "#f39c12";
  const COLOR_POWERUP_MULTIPLIER = "#3498db";

  // ----------------------------------------------------------
  // Game state
  // ----------------------------------------------------------
  const STATE = { READY: 0, PLAYING: 1, GAME_OVER: 2 };
  let gameState = STATE.READY;

  let bird = null;
  let pipes = [];
  let score = 0;
  let highScore = loadHighScore();
  let lastPipeSpawn = 0;
  let groundOffset = 0;
  let lastTimestamp = 0;
  let flashTimer = 0; // white flash on death
  
  // Combat state
  let playerHealth = PLAYER_MAX_HEALTH;
  let playerBullets = [];
  let enemies = [];
  let enemyBullets = [];
  let powerups = [];
  let lastBulletFire = 0;
  let lastEnemySpawn = 0;
  let lastPowerupSpawn = 0;
  let isFiring = false; // for tap-and-hold
  let scoreMultiplier = 1;
  
  // Active powerup timers
  let invincibilityTimer = 0;
  let multishotTimer = 0;
  let multiplierTimer = 0;
  let invincibilityFlashTimer = 0;

  // ----------------------------------------------------------
  // Powerup types
  // ----------------------------------------------------------
  const POWERUP_TYPES = {
    INVINCIBILITY: 0,
    MULTISHOT: 1,
    SCORE_MULTIPLIER: 2
  };

  // ----------------------------------------------------------
  // Utility
  // ----------------------------------------------------------
  function loadHighScore() {
    try {
      return parseInt(localStorage.getItem("flappyHighScore")) || 0;
    } catch {
      return 0;
    }
  }

  function saveHighScore(val) {
    try {
      localStorage.setItem("flappyHighScore", val);
    } catch {
      // ignore
    }
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function currentGap() {
    const shrink = Math.floor(score / 5) * GAP_SHRINK_PER_5;
    return Math.max(GAP_SIZE_MIN, GAP_SIZE_BASE - shrink);
  }

  function currentSpeed() {
    return PIPE_SPEED_BASE + Math.floor(score / 5) * PIPE_SPEED_INCREMENT;
  }

  function currentEnemySpeed() {
    return ENEMY_SPEED_BASE + Math.floor(score / 10) * 0.3;
  }

  // ----------------------------------------------------------
  // Projectiles
  // ----------------------------------------------------------
  function createPlayerBullet(x, y, spread = 0) {
    return {
      x: x,
      y: y,
      vx: BULLET_SPEED,
      vy: spread * BULLET_SPEED * 0.3, // spread for multishot
      radius: BULLET_RADIUS
    };
  }

  function createEnemyBullet(x, y, targetX, targetY) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = ENEMY_BULLET_SPEED;
    
    return {
      x: x,
      y: y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      radius: BULLET_RADIUS
    };
  }

  function updatePlayerBullets(dt) {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const bullet = playerBullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      
      // Remove bullets that go off screen
      if (bullet.x > GAME_WIDTH + 50 || bullet.y < -50 || bullet.y > GAME_HEIGHT + 50) {
        playerBullets.splice(i, 1);
      }
    }
  }

  function updateEnemyBullets(dt) {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const bullet = enemyBullets[i];
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      
      // Remove bullets that go off screen
      if (bullet.x < -50 || bullet.x > GAME_WIDTH + 50 || bullet.y < -50 || bullet.y > GAME_HEIGHT + 50) {
        enemyBullets.splice(i, 1);
      }
    }
  }

  function drawPlayerBullets() {
    ctx.fillStyle = COLOR_PLAYER_BULLET;
    for (const bullet of playerBullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawEnemyBullets() {
    ctx.fillStyle = COLOR_ENEMY_BULLET;
    for (const bullet of enemyBullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ----------------------------------------------------------
  // Enemies
  // ----------------------------------------------------------
  function createEnemy() {
    const minY = 60;
    const maxY = GROUND_Y - 60;
    const y = Math.random() * (maxY - minY) + minY;
    
    return {
      x: GAME_WIDTH + ENEMY_RADIUS,
      y: y,
      radius: ENEMY_RADIUS,
      health: 1, // die in 1 hit
      lastFire: 0,
      fireDelay: ENEMY_FIRE_INTERVAL + Math.random() * 1000 // add some variance
    };
  }

  function updateEnemies(dt, timestamp) {
    const speed = currentEnemySpeed();
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      enemy.x -= speed * dt;
      
      // Enemy firing
      if (timestamp - enemy.lastFire > enemy.fireDelay) {
        enemy.lastFire = timestamp;
        enemyBullets.push(createEnemyBullet(enemy.x, enemy.y, bird.x, bird.y));
      }
      
      // Remove enemies that go off screen
      if (enemy.x + enemy.radius < -10) {
        enemies.splice(i, 1);
      }
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      ctx.fillStyle = COLOR_ENEMY;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Enemy eye
      ctx.fillStyle = COLOR_BIRD_EYE_WHITE;
      ctx.beginPath();
      ctx.arc(enemy.x - 4, enemy.y - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = COLOR_BIRD_EYE_PUPIL;
      ctx.beginPath();
      ctx.arc(enemy.x - 5, enemy.y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ----------------------------------------------------------
  // Powerups
  // ----------------------------------------------------------
  function createPowerup() {
    const minY = 60;
    const maxY = GROUND_Y - 60;
    const y = Math.random() * (maxY - minY) + minY;
    const type = Math.floor(Math.random() * 3); // 0, 1, or 2
    
    return {
      x: GAME_WIDTH + POWERUP_RADIUS,
      y: y,
      radius: POWERUP_RADIUS,
      type: type,
      pulseTimer: 0
    };
  }

  function updatePowerups(dt) {
    const speed = currentSpeed();
    for (let i = powerups.length - 1; i >= 0; i--) {
      const powerup = powerups[i];
      powerup.x -= speed * dt;
      powerup.pulseTimer += dt;
      
      // Remove powerups that go off screen
      if (powerup.x + powerup.radius < -10) {
        powerups.splice(i, 1);
      }
    }
  }

  function drawPowerups() {
    for (const powerup of powerups) {
      const pulseScale = 1 + Math.sin(powerup.pulseTimer * 0.1) * 0.2;
      
      ctx.save();
      ctx.translate(powerup.x, powerup.y);
      ctx.scale(pulseScale, pulseScale);
      
      let color;
      switch (powerup.type) {
        case POWERUP_TYPES.INVINCIBILITY:
          color = COLOR_POWERUP_INVINCIBILITY;
          break;
        case POWERUP_TYPES.MULTISHOT:
          color = COLOR_POWERUP_MULTISHOT;
          break;
        case POWERUP_TYPES.SCORE_MULTIPLIER:
          color = COLOR_POWERUP_MULTIPLIER;
          break;
      }
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, powerup.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner glow
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.beginPath();
      ctx.arc(0, 0, powerup.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
  }

  // ----------------------------------------------------------
  // Bird
  // ----------------------------------------------------------
  function createBird() {
    return {
      x: BIRD_X,
      y: GAME_HEIGHT / 2 - 30,
      vy: 0,
      rotation: 0,
      flapFrame: 0, // simple wing animation timer
    };
  }

  function flapBird() {
    bird.vy = FLAP_STRENGTH;
    bird.flapFrame = 8; // frames of wing-up animation
  }

  function fireBullet(timestamp) {
    if (timestamp - lastBulletFire < BULLET_COOLDOWN) return;
    
    lastBulletFire = timestamp;
    const bulletX = bird.x + BIRD_RADIUS;
    const bulletY = bird.y;
    
    if (multishotTimer > 0) {
      // Fire 3 bullets in a spread
      playerBullets.push(createPlayerBullet(bulletX, bulletY, -0.5)); // Up
      playerBullets.push(createPlayerBullet(bulletX, bulletY, 0));    // Straight
      playerBullets.push(createPlayerBullet(bulletX, bulletY, 0.5));  // Down
    } else {
      // Fire single bullet
      playerBullets.push(createPlayerBullet(bulletX, bulletY, 0));
    }
  }

  function updateBird(dt) {
    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;
    bird.flapFrame = Math.max(0, bird.flapFrame - 1);

    // Rotation: nose up when rising, nose down when falling
    const targetRot = clamp(bird.vy * 3, -30, 90);
    bird.rotation += (targetRot - bird.rotation) * 0.15 * dt;

    // Ceiling clamp
    if (bird.y - BIRD_RADIUS < 0) {
      bird.y = BIRD_RADIUS;
      bird.vy = 0;
    }
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Wing
    const wingYOffset = bird.flapFrame > 0 ? -6 : 3;
    ctx.fillStyle = COLOR_BIRD_WING;
    ctx.beginPath();
    ctx.ellipse(-3, wingYOffset, 10, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = COLOR_BIRD_BODY;
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Belly
    ctx.fillStyle = COLOR_BIRD_BELLY;
    ctx.beginPath();
    ctx.ellipse(3, 4, 9, 8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Eye (white)
    ctx.fillStyle = COLOR_BIRD_EYE_WHITE;
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eye (pupil)
    ctx.fillStyle = COLOR_BIRD_EYE_PUPIL;
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = COLOR_BIRD_BEAK;
    ctx.beginPath();
    ctx.moveTo(13, -1);
    ctx.lineTo(22, 3);
    ctx.lineTo(13, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ----------------------------------------------------------
  // Pipes
  // ----------------------------------------------------------
  function createPipe() {
    const gap = currentGap();
    const minTop = 60;
    const maxTop = GROUND_Y - gap - 60;
    const topHeight = Math.random() * (maxTop - minTop) + minTop;

    return {
      x: GAME_WIDTH + PIPE_WIDTH,
      topHeight: topHeight,
      bottomY: topHeight + gap,
      scored: false,
    };
  }

  function updatePipes(dt) {
    const speed = currentSpeed();
    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].x -= speed * dt;

      // Score when bird passes pipe center
      if (!pipes[i].scored && pipes[i].x + PIPE_WIDTH / 2 < bird.x) {
        pipes[i].scored = true;
        score++;
        if (score > highScore) {
          highScore = score;
          saveHighScore(highScore);
        }
      }

      // Remove offscreen pipes
      if (pipes[i].x + PIPE_WIDTH < -10) {
        pipes.splice(i, 1);
      }
    }
  }

  function drawPipe(pipe) {
    const capHeight = 24;
    const capOverhang = 4;

    // Top pipe body
    ctx.fillStyle = COLOR_PIPE;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    // Top pipe dark border
    ctx.fillStyle = COLOR_PIPE_DARK;
    ctx.fillRect(pipe.x, 0, 3, pipe.topHeight);
    ctx.fillRect(pipe.x + PIPE_WIDTH - 3, 0, 3, pipe.topHeight);
    // Top pipe cap
    ctx.fillStyle = COLOR_PIPE_CAP;
    ctx.fillRect(
      pipe.x - capOverhang,
      pipe.topHeight - capHeight,
      PIPE_WIDTH + capOverhang * 2,
      capHeight
    );
    ctx.fillStyle = COLOR_PIPE_DARK;
    ctx.fillRect(
      pipe.x - capOverhang,
      pipe.topHeight - capHeight,
      PIPE_WIDTH + capOverhang * 2,
      3
    );
    ctx.fillRect(
      pipe.x - capOverhang,
      pipe.topHeight - 3,
      PIPE_WIDTH + capOverhang * 2,
      3
    );

    // Bottom pipe body
    const bottomH = GROUND_Y - pipe.bottomY;
    ctx.fillStyle = COLOR_PIPE;
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, bottomH);
    // Bottom pipe dark border
    ctx.fillStyle = COLOR_PIPE_DARK;
    ctx.fillRect(pipe.x, pipe.bottomY, 3, bottomH);
    ctx.fillRect(pipe.x + PIPE_WIDTH - 3, pipe.bottomY, 3, bottomH);
    // Bottom pipe cap
    ctx.fillStyle = COLOR_PIPE_CAP;
    ctx.fillRect(
      pipe.x - capOverhang,
      pipe.bottomY,
      PIPE_WIDTH + capOverhang * 2,
      capHeight
    );
    ctx.fillStyle = COLOR_PIPE_DARK;
    ctx.fillRect(
      pipe.x - capOverhang,
      pipe.bottomY,
      PIPE_WIDTH + capOverhang * 2,
      3
    );
    ctx.fillRect(
      pipe.x - capOverhang,
      pipe.bottomY + capHeight - 3,
      PIPE_WIDTH + capOverhang * 2,
      3
    );
  }

  // ----------------------------------------------------------
  // Collision
  // ----------------------------------------------------------
  function checkCollision() {
    // Ground collision
    if (bird.y + BIRD_RADIUS >= GROUND_Y) {
      bird.y = GROUND_Y - BIRD_RADIUS;
      return true;
    }

    // Pipe collision (circle vs rect AABB)
    for (const pipe of pipes) {
      // Top pipe rect
      if (
        circleRectCollision(
          bird.x,
          bird.y,
          BIRD_RADIUS - 2,
          pipe.x,
          0,
          PIPE_WIDTH,
          pipe.topHeight
        )
      ) {
        return true;
      }
      // Bottom pipe rect
      if (
        circleRectCollision(
          bird.x,
          bird.y,
          BIRD_RADIUS - 2,
          pipe.x,
          pipe.bottomY,
          PIPE_WIDTH,
          GROUND_Y - pipe.bottomY
        )
      ) {
        return true;
      }
    }

    return false;
  }

  function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const closestX = clamp(cx, rx, rx + rw);
    const closestY = clamp(cy, ry, ry + rh);
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  function circleCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist = dx * dx + dy * dy;
    const radii = r1 + r2;
    return dist < radii * radii;
  }

  function checkCombatCollisions() {
    // Player bullets vs enemies
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const bullet = playerBullets[i];
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (circleCircleCollision(bullet.x, bullet.y, bullet.radius, enemy.x, enemy.y, enemy.radius)) {
          playerBullets.splice(i, 1);
          enemy.health--;
          if (enemy.health <= 0) {
            enemies.splice(j, 1);
            score += 2 * scoreMultiplier; // Bonus points for killing enemies
            if (score > highScore) {
              highScore = score;
              saveHighScore(highScore);
            }
          }
          break;
        }
      }
    }

    // Enemy bullets vs player (only if not invincible)
    if (invincibilityTimer <= 0) {
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (circleCircleCollision(bullet.x, bullet.y, bullet.radius, bird.x, bird.y, BIRD_RADIUS - 2)) {
          enemyBullets.splice(i, 1);
          playerHealth--;
          invincibilityTimer = 1000; // 1 second of invincibility after being hit
          if (playerHealth <= 0) {
            return true; // Player died
          }
          break;
        }
      }
    }

    // Enemies vs player (only if not invincible)
    if (invincibilityTimer <= 0) {
      for (const enemy of enemies) {
        if (circleCircleCollision(bird.x, bird.y, BIRD_RADIUS - 2, enemy.x, enemy.y, enemy.radius)) {
          playerHealth--;
          invincibilityTimer = 1000; // 1 second of invincibility after being hit
          if (playerHealth <= 0) {
            return true; // Player died
          }
          break;
        }
      }
    }

    // Player vs powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
      const powerup = powerups[i];
      if (circleCircleCollision(bird.x, bird.y, BIRD_RADIUS, powerup.x, powerup.y, powerup.radius)) {
        powerups.splice(i, 1);
        applyPowerup(powerup.type);
      }
    }

    return false; // Player survived
  }

  function applyPowerup(type) {
    switch (type) {
      case POWERUP_TYPES.INVINCIBILITY:
        invincibilityTimer = INVINCIBILITY_DURATION;
        break;
      case POWERUP_TYPES.MULTISHOT:
        multishotTimer = MULTISHOT_DURATION;
        break;
      case POWERUP_TYPES.SCORE_MULTIPLIER:
        multiplierTimer = SCORE_MULTIPLIER_DURATION;
        scoreMultiplier = 2;
        break;
    }
  }

  // ----------------------------------------------------------
  // Drawing helpers
  // ----------------------------------------------------------
  function drawBackground() {
    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    grad.addColorStop(0, COLOR_SKY_TOP);
    grad.addColorStop(1, COLOR_SKY_BOTTOM);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);

    // Clouds (static decorative)
    drawCloud(60, 80, 0.8);
    drawCloud(220, 140, 0.6);
    drawCloud(330, 60, 0.5);
    drawCloud(150, 220, 0.7);
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.arc(25, -5, 20, 0, Math.PI * 2);
    ctx.arc(50, 0, 25, 0, Math.PI * 2);
    ctx.arc(15, 10, 18, 0, Math.PI * 2);
    ctx.arc(35, 10, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGround(dt) {
    if (gameState === STATE.PLAYING) {
      groundOffset = (groundOffset + currentSpeed() * dt) % 24;
    }

    // Ground fill
    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GROUND_HEIGHT);

    // Ground top stripe
    ctx.fillStyle = COLOR_GROUND_DARK;
    ctx.fillRect(0, GROUND_Y, GAME_WIDTH, 3);

    // Ground texture (moving dashes)
    ctx.fillStyle = COLOR_GROUND_DARK;
    for (let x = -groundOffset; x < GAME_WIDTH; x += 24) {
      ctx.fillRect(x, GROUND_Y + 12, 16, 3);
      ctx.fillRect(x + 10, GROUND_Y + 28, 16, 3);
    }
  }

  function drawScore() {
    // Current score — large centered text
    ctx.save();
    ctx.font = "bold 48px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Stroke
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#3a2e1a";
    const scoreText = scoreMultiplier > 1 ? score + " x" + scoreMultiplier : score;
    ctx.strokeText(scoreText, GAME_WIDTH / 2, 40);

    // Fill
    ctx.fillStyle = scoreMultiplier > 1 ? COLOR_POWERUP_MULTIPLIER : "#ffffff";
    ctx.fillText(scoreText, GAME_WIDTH / 2, 40);
    ctx.restore();
  }

  function drawHealthBar() {
    const heartSize = 20;
    const heartSpacing = 25;
    const startX = 20;
    const startY = 20;

    for (let i = 0; i < PLAYER_MAX_HEALTH; i++) {
      const x = startX + i * heartSpacing;
      const y = startY;
      
      ctx.fillStyle = i < playerHealth ? COLOR_HEALTH_FULL : COLOR_HEALTH_EMPTY;
      
      // Draw heart shape
      ctx.beginPath();
      ctx.moveTo(x, y + heartSize * 0.3);
      ctx.bezierCurveTo(x, y, x - heartSize * 0.5, y, x - heartSize * 0.5, y + heartSize * 0.3);
      ctx.bezierCurveTo(x - heartSize * 0.5, y + heartSize * 0.7, x, y + heartSize, x, y + heartSize);
      ctx.bezierCurveTo(x, y + heartSize, x + heartSize * 0.5, y + heartSize * 0.7, x + heartSize * 0.5, y + heartSize * 0.3);
      ctx.bezierCurveTo(x + heartSize * 0.5, y, x, y, x, y + heartSize * 0.3);
      ctx.fill();
    }
  }

  function drawPowerupIndicators() {
    const iconSize = 16;
    const iconSpacing = 20;
    let iconX = GAME_WIDTH - 30;
    const iconY = 20;

    // Invincibility indicator
    if (invincibilityTimer > 0) {
      ctx.fillStyle = COLOR_POWERUP_INVINCIBILITY;
      ctx.fillRect(iconX - iconSize, iconY, iconSize, iconSize);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("I", iconX - iconSize / 2, iconY + 12);
      
      iconX -= iconSpacing;
    }

    // Multishot indicator
    if (multishotTimer > 0) {
      ctx.fillStyle = COLOR_POWERUP_MULTISHOT;
      ctx.fillRect(iconX - iconSize, iconY, iconSize, iconSize);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("M", iconX - iconSize / 2, iconY + 12);
      
      iconX -= iconSpacing;
    }

    // Score multiplier indicator
    if (multiplierTimer > 0) {
      ctx.fillStyle = COLOR_POWERUP_MULTIPLIER;
      ctx.fillRect(iconX - iconSize, iconY, iconSize, iconSize);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("2x", iconX - iconSize / 2, iconY + 12);
    }
  }

  function drawShootingArea() {
    // Draw a subtle indicator for the shooting area on mobile
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(GAME_WIDTH * 0.6, 0, GAME_WIDTH * 0.4, GAME_HEIGHT);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SHOOT", GAME_WIDTH * 0.8, GAME_HEIGHT - 30);
    ctx.restore();
  }

  function drawReadyScreen() {
    drawBackground();
    drawGround(0);

    // Title
    ctx.save();
    ctx.font = "bold 44px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.lineWidth = 4;
    ctx.strokeStyle = "#3a2e1a";
    ctx.strokeText("Flappy Bird", GAME_WIDTH / 2, 140);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Flappy Bird", GAME_WIDTH / 2, 140);

    // Instructions
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#3a2e1a";
    ctx.strokeText("Space/Tap: Flap", GAME_WIDTH / 2, 320);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Space/Tap: Flap", GAME_WIDTH / 2, 320);

    ctx.strokeText("F/Right Side: Shoot", GAME_WIDTH / 2, 345);
    ctx.fillText("F/Right Side: Shoot", GAME_WIDTH / 2, 345);
    
    ctx.strokeText("Tap to Start", GAME_WIDTH / 2, 370);
    ctx.fillStyle = "#f5c842";
    ctx.fillText("Tap to Start", GAME_WIDTH / 2, 370);

    // Animated bird preview (bobbing)
    const bobY = Math.sin(Date.now() / 300) * 10;
    bird.y = GAME_HEIGHT / 2 - 40 + bobY;
    bird.rotation = 0;
    bird.flapFrame = Math.sin(Date.now() / 150) > 0 ? 6 : 0;
    drawBird();

    // High score
    if (highScore > 0) {
      ctx.font = "bold 16px Arial, sans-serif";
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#3a2e1a";
      ctx.strokeText("Best: " + highScore, GAME_WIDTH / 2, 400);
      ctx.fillStyle = "#f5c842";
      ctx.fillText("Best: " + highScore, GAME_WIDTH / 2, 400);
    }

    ctx.restore();
  }

  function drawGameOverScreen() {
    // Semi-transparent overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Game Over title
    ctx.font = "bold 42px Arial, sans-serif";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#3a2e1a";
    ctx.strokeText("Game Over", GAME_WIDTH / 2, 180);
    ctx.fillStyle = "#e8572a";
    ctx.fillText("Game Over", GAME_WIDTH / 2, 180);

    // Score panel background
    const panelX = GAME_WIDTH / 2 - 100;
    const panelY = 220;
    const panelW = 200;
    const panelH = 120;
    ctx.fillStyle = "#deb866";
    roundRect(panelX, panelY, panelW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = "#8b6914";
    ctx.lineWidth = 3;
    roundRect(panelX, panelY, panelW, panelH, 10);
    ctx.stroke();

    // Score label + value
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillStyle = "#5a3e1b";
    ctx.fillText("Score", GAME_WIDTH / 2, panelY + 30);
    ctx.font = "bold 30px Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#5a3e1b";
    ctx.strokeText(score, GAME_WIDTH / 2, panelY + 58);
    ctx.fillText(score, GAME_WIDTH / 2, panelY + 58);

    // High score
    ctx.font = "bold 18px Arial, sans-serif";
    ctx.fillStyle = "#5a3e1b";
    ctx.fillText("Best", GAME_WIDTH / 2, panelY + 82);
    ctx.font = "bold 24px Arial, sans-serif";
    ctx.fillStyle = "#f5c842";
    ctx.strokeStyle = "#5a3e1b";
    ctx.strokeText(highScore, GAME_WIDTH / 2, panelY + 105);
    ctx.fillText(highScore, GAME_WIDTH / 2, panelY + 105);

    // New high score indicator
    if (score === highScore && score > 0) {
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillStyle = "#e8572a";
      ctx.fillText("NEW BEST!", GAME_WIDTH / 2 + 55, panelY + 105);
    }

    // Restart prompt
    ctx.font = "bold 20px Arial, sans-serif";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#3a2e1a";
    ctx.strokeText("Tap to Restart", GAME_WIDTH / 2, 400);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Tap to Restart", GAME_WIDTH / 2, 400);

    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // ----------------------------------------------------------
  // Game state management
  // ----------------------------------------------------------
  function resetGame() {
    bird = createBird();
    pipes = [];
    playerBullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    score = 0;
    playerHealth = PLAYER_MAX_HEALTH;
    scoreMultiplier = 1;
    lastPipeSpawn = 0;
    lastBulletFire = 0;
    lastEnemySpawn = 0;
    lastPowerupSpawn = 0;
    groundOffset = 0;
    flashTimer = 0;
    isFiring = false;
    invincibilityTimer = 0;
    multishotTimer = 0;
    multiplierTimer = 0;
    invincibilityFlashTimer = 0;
    gameState = STATE.READY;
  }

  function startPlaying() {
    gameState = STATE.PLAYING;
    bird.vy = 0;
    const now = performance.now();
    lastPipeSpawn = now;
    lastEnemySpawn = now;
    lastPowerupSpawn = now;
    flapBird();
  }

  function die() {
    gameState = STATE.GAME_OVER;
    flashTimer = 6; // frames of white flash
  }

  // ----------------------------------------------------------
  // Input
  // ----------------------------------------------------------
  function handleInput() {
    switch (gameState) {
      case STATE.READY:
        startPlaying();
        break;
      case STATE.PLAYING:
        flapBird();
        break;
      case STATE.GAME_OVER:
        resetGame();
        break;
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.key === "w" || e.key === "W") {
      e.preventDefault();
      handleInput();
    } else if (e.code === "KeyF" && gameState === STATE.PLAYING) {
      e.preventDefault();
      fireBullet(performance.now());
    }
  });

  canvas.addEventListener("click", (e) => {
    e.preventDefault();
    if (gameState === STATE.PLAYING) {
      // Check if click is on right side of screen (for shooting)
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const relativeX = (clickX / rect.width) * GAME_WIDTH;
      
      if (relativeX > GAME_WIDTH * 0.6) {
        fireBullet(performance.now());
      } else {
        handleInput();
      }
    } else {
      handleInput();
    }
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (gameState === STATE.PLAYING) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const relativeX = (touchX / rect.width) * GAME_WIDTH;
      
      if (relativeX > GAME_WIDTH * 0.6) {
        isFiring = true;
        fireBullet(performance.now());
      } else {
        handleInput();
      }
    } else {
      handleInput();
    }
  });

  canvas.addEventListener("touchend", (e) => {
    e.preventDefault();
    isFiring = false;
  });

  // ----------------------------------------------------------
  // Main game loop
  // ----------------------------------------------------------
  function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const rawDt = (timestamp - lastTimestamp) / 16.667; // normalize to ~60fps
    const dt = Math.min(rawDt, 3); // cap to prevent spiral of death
    lastTimestamp = timestamp;

    // --- Update ---
    if (gameState === STATE.PLAYING) {
      updateBird(dt);
      updatePipes(dt);
      updatePlayerBullets(dt);
      updateEnemyBullets(dt);
      updateEnemies(dt, timestamp);
      updatePowerups(dt);

      // Update powerup timers
      if (invincibilityTimer > 0) {
        invincibilityTimer -= dt * 16.667; // convert back to ms
        invincibilityFlashTimer += dt * 16.667;
      }
      if (multishotTimer > 0) {
        multishotTimer -= dt * 16.667;
      }
      if (multiplierTimer > 0) {
        multiplierTimer -= dt * 16.667;
        if (multiplierTimer <= 0) {
          scoreMultiplier = 1;
        }
      }

      // Continuous firing for mobile tap-and-hold
      if (isFiring) {
        fireBullet(timestamp);
      }

      // Spawn pipes on interval
      if (timestamp - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
        pipes.push(createPipe());
        lastPipeSpawn = timestamp;
      }

      // Spawn enemies on interval
      if (timestamp - lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
        enemies.push(createEnemy());
        lastEnemySpawn = timestamp;
      }

      // Spawn powerups on interval
      if (timestamp - lastPowerupSpawn > POWERUP_SPAWN_INTERVAL) {
        powerups.push(createPowerup());
        lastPowerupSpawn = timestamp;
      }

      // Pipe collision (traditional Flappy Bird death)
      if (checkCollision()) {
        die();
      }

      // Combat collisions
      if (checkCombatCollisions()) {
        die();
      }
    }

    // --- Render ---
    drawBackground();

    // Pipes behind everything
    for (const pipe of pipes) {
      drawPipe(pipe);
    }

    // Enemies and powerups
    drawEnemies();
    drawPowerups();

    // Projectiles
    drawPlayerBullets();
    drawEnemyBullets();

    drawGround(dt);

    // Bird (always visible, with invincibility flash)
    if (gameState !== STATE.READY) {
      const shouldFlash = invincibilityTimer > 0 && 
        Math.floor(invincibilityFlashTimer / INVINCIBILITY_FLASH_INTERVAL) % 2 === 0;
      
      if (!shouldFlash) {
        drawBird();
      }
    }

    // Flash effect on death
    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${flashTimer / 6})`;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      flashTimer--;
    }

    // UI overlays
    if (gameState === STATE.READY) {
      drawReadyScreen();
    } else if (gameState === STATE.PLAYING) {
      drawScore();
      drawHealthBar();
      drawPowerupIndicators();
      drawShootingArea();
    } else if (gameState === STATE.GAME_OVER) {
      drawBird(); // draw bird on top of overlay too
      drawScore();
      drawGameOverScreen();
    }

    requestAnimationFrame(gameLoop);
  }

  // ----------------------------------------------------------
  // Start
  // ----------------------------------------------------------
  resetGame();
  requestAnimationFrame(gameLoop);
})();
