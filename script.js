// === GAME VARIABLES ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let health = 100;
let money = 100;
let wave = 1;

const healthEl = document.getElementById("health");
const moneyEl = document.getElementById("money");
const waveEl = document.getElementById("wave");

const TILE_SIZE = 40;

// === GAME ENTITIES ===
let enemies = [];
let towers = [];
let bullets = [];

// === PATH (simple fixed path for enemies) ===
const path = [
  { x: 0, y: 100 },
  { x: 760, y: 100 },
  { x: 760, y: 400 },
  { x: 0, y: 400 },
  { x: 0, y: 580 },
];

// === CLASSES ===
class Enemy {
  constructor() {
    this.x = path[0].x;
    this.y = path[0].y;
    this.size = 30; // Bigger enemies
    this.health = 30 + wave * 5;
    this.speed = 0.8 + wave * 0.05; // slower base and smaller increment

    this.pathIndex = 0;
  }

  move() {
    let target = path[this.pathIndex + 1];
    if (!target) {
      // Reached end
      health -= 10;
      updateHUD();
      enemies.splice(enemies.indexOf(this), 1);
      return;
    }
    let dx = target.x - this.x;
    let dy = target.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.speed) {
      this.pathIndex++;
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Health bar
    ctx.fillStyle = "green";
    ctx.fillRect(
      this.x - this.size / 2,
      this.y - this.size,
      (this.health / (30 + wave * 5)) * this.size,
      5
    );
  }
}

class Tower {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.range = 100;

    this.fireCooldown = 0;
    this.damage = 15;
    this.fireRate = 45;

    if (type === "sniper") {
      this.range = 200;
      this.damage = 25;
      this.fireRate = 90;
    }
    if (type === "slow") {
      this.range = 120;
      this.damage = 5;
    }
  }

  update() {
    if (this.fireCooldown > 0) {
      this.fireCooldown--;
      return;
    }
    let target = enemies.find((e) => {
      let dx = e.x - this.x;
      let dy = e.y - this.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.range;
    });
    if (target) {
      bullets.push(new Bullet(this.x, this.y, target, this.damage));
      this.fireCooldown = this.fireRate;
    }
  }

  draw() {
    ctx.fillStyle = "blue";
    ctx.fillRect(this.x - 10, this.y - 10, 20, 20);
  }
}

class Bullet {
  constructor(x, y, target, damage) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.speed = 5;
    this.damage = damage;
  }

  update() {
    if (!this.target) return;
    let dx = this.target.x - this.x;
    let dy = this.target.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.speed) {
      this.target.health -= this.damage;
      if (this.target.health <= 0) {
        money += 10;
        enemies.splice(enemies.indexOf(this.target), 1);
        updateHUD();
      }
      bullets.splice(bullets.indexOf(this), 1);
    } else {
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// === GAME LOOP ===
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw path (thicker & more visible)
  ctx.strokeStyle = "#777";
  ctx.lineWidth = 30;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let p of path) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();

  // Update enemies
  enemies.forEach((e) => {
    e.move();
    e.draw();
  });

  // Update towers
  towers.forEach((t) => {
    t.update();
    t.draw();
  });

  // Update bullets
  bullets.forEach((b) => {
    b.update();
    b.draw();
  });

  // Lose condition
  if (health <= 0) {
    alert("Game Over!");
    return;
  }

  requestAnimationFrame(gameLoop);
}

// === WAVE SPAWNING ===
function spawnWave() {
  for (let i = 0; i < 3 + Math.floor(wave * 0.5); i++) {
    setTimeout(() => {
      enemies.push(new Enemy());
    }, i * 1200); // 1.2s instead of 0.8s
  }
  wave++;
  updateHUD();
}

// === HUD UPDATE ===
function updateHUD() {
  healthEl.textContent = `Health: ${health}`;
  moneyEl.textContent = `Money: ${money}`;
  waveEl.textContent = `Wave: ${wave}`;
}

// === EVENT HANDLERS ===
document.getElementById("buildBasicTower").addEventListener("click", () => {
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (money >= 50) {
      towers.push(new Tower(x, y, "basic"));
      money -= 50;
      updateHUD();
    }
    canvas.onclick = null;
  };
});

document.getElementById("buildSniperTower").addEventListener("click", () => {
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (money >= 100) {
      towers.push(new Tower(x, y, "sniper"));
      money -= 100;
      updateHUD();
    }
    canvas.onclick = null;
  };
});

document.getElementById("buildSlowTower").addEventListener("click", () => {
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (money >= 75) {
      towers.push(new Tower(x, y, "slow"));
      money -= 75;
      updateHUD();
    }
    canvas.onclick = null;
  };
});

// === START GAME ===
updateHUD();
towers.push(new Tower(400, 300, "basic")); // Default starting tower
spawnWave(); // Spawn immediately
gameLoop();
setInterval(spawnWave, 8000); // 8 seconds
