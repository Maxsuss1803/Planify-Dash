
// 🎵 Système de musique aléatoire
const musicTracks = [
  "assets/audio/track1.mp3",
  "assets/audio/track2.mp3",
  "assets/audio/track3.mp3",
  "assets/audio/track4.mp3",
  "assets/audio/track5.mp3",
  "assets/audio/track6.mp3"
];

let music = new Audio();
let lastTrackIndex = -1;

function playRandomTrack() {
  let index;
  do {
    index = Math.floor(Math.random() * musicTracks.length);
  } while (index === lastTrackIndex);
  lastTrackIndex = index;

  music.src = musicTracks[index];
  music.volume = 0.5;
  music.play();
  music.onended = playRandomTrack;
}

document.addEventListener("DOMContentLoaded", () => {
  playRandomTrack();
});



const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const sfxPlay = new Audio("assets/audio/play.mp3");
const sfxMort = new Audio("assets/audio/mort.mp3");

music.volume = 0.5;

let running = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("planify_highscore")) || 0;
let godMode = false;

let player = {
  x: 50,
  y: 300,
  size: 60,
  vy: 0,
  gravity: 0.8,
  jump: -18,
  angle: 0,
  targetAngle: 0
};

let obstacles = [];
let spikes = [];
let jumpPads = [];
let advancedTraps = [];
let speed = 6;
let frame = 0;
let lastObstacleFrame = 0;
let pauseZoneTimer = 0;
const groundHeight = 150;

const themes = [
  { background: "#111", cube: "#7CFC00" },
  { background: "#220000", cube: "#FF5555" },
  { background: "#002244", cube: "#55AAFF" },
  { background: "#220022", cube: "#CC66FF" },
  { background: "#113322", cube: "#77FF88" },
  { background: "#222222", cube: "#FFFFFF" }
];


let currentBackground = { r: 17, g: 17, b: 17 };
let targetBackground = { r: 17, g: 17, b: 17 };
let transitionProgress = 1;

function hexToRgb(hex) {
  let bigint = parseInt(hex.replace("#", ""), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function interpolateColor(c1, c2, t) {
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t
  };
}

function applyTheme(score) {
  const index = Math.floor(score / 500) % themes.length;
  const next = hexToRgb(themes[index].background);
  if (
    next.r !== targetBackground.r ||
    next.g !== targetBackground.g ||
    next.b !== targetBackground.b
  ) {
    targetBackground = next;
    transitionProgress = 0;
  }

  if (transitionProgress < 1) transitionProgress += 0.003;
  const bg = interpolateColor(currentBackground, targetBackground, transitionProgress);
  currentBackground = bg;
  ctx.fillStyle = `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`;
}


function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

function currentTheme() {
  const index = Math.floor(score / 500) % themes.length;
  return themes[index];
}

function generateObstacle() {
  if (pauseZoneTimer > 0) return;
  const rand = Math.random();
  const offset = Math.floor(Math.random() * 100);

  if (score >= 1000 && rand < 0.1) {
    advancedTraps.push({
      x: canvas.width + offset,
      y: canvas.height - groundHeight - 200,
      width: 10,
      height: 200,
      vy: Math.random() > 0.5 ? 3 : -3
    });
  } else if (score >= 500 && rand < 0.2) {
    advancedTraps.push({
      x: canvas.width + offset,
      y: canvas.height - groundHeight - 100 - Math.random() * 100,
      width: 30,
      height: 100,
      vy: Math.random() > 0.5 ? 2 : -2
    });
  } else if (rand < 0.4) {
    const height = 40 + Math.random() * 60;
    obstacles.push({
      x: canvas.width + offset,
      y: canvas.height - groundHeight - height,
      width: 40 + Math.random() * 30,
      height: height
    });
  } else if (rand < 0.7) {
    spikes.push({
      x: canvas.width + offset,
      y: canvas.height - groundHeight,
      size: 40
    });
  } else {
    jumpPads.push({
      x: canvas.width + offset,
      y: canvas.height - groundHeight - 20,
      size: 30
    });
  }
}

function startGame() {
  const selectedSpeed = document.getElementById('speedSelect').value;
  if (selectedSpeed === "slow") speed = 4;
  else if (selectedSpeed === "fast") speed = 9;
  else speed = 6;

  document.getElementById('menu').style.display = 'none';
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('hud').style.display = 'block';
  canvas.style.display = 'block';
  resizeCanvas();
  music.currentTime = 0;
  sfxPlay.play();
music.play();
  player.y = 300;
  player.vy = 0;
  player.angle = 0;
  player.targetAngle = 0;
  obstacles = [];
  spikes = [];
  jumpPads = [];
  advancedTraps = [];
  score = 0;
  frame = 0;
  lastObstacleFrame = 0;
  pauseZone = false;
  running = true;
  gameLoop();
}

function restartGame() {
  startGame();
}

function drawRotatedCube(x, y, size, angle, color) {
  ctx.save();
  ctx.translate(x + size / 2, y + size / 2);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawSpike(spike) {
  ctx.fillStyle = '#77ff66';
  ctx.shadowColor = '#99ffaa';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(spike.x, spike.y);
  ctx.lineTo(spike.x + spike.size / 2, spike.y - spike.size);
  ctx.lineTo(spike.x + spike.size, spike.y);
  ctx.closePath();
  ctx.fill();
}

function gameLoop() {
  if (!running) return;
  frame++;
  score = Math.floor(frame / 5);
  if (pauseZoneTimer > 0) pauseZoneTimer--;

  document.getElementById('scoreLive').innerText = "Score: " + score;
  document.getElementById('highScoreLive').innerText = "High Score: " + highScore;

  // Every 350 points, occasionally give a pause zone
  if (score % 350 === 0 && frame % 60 === 0 && pauseZoneTimer <= 0) {
  if (Math.random() < 0.25) pauseZoneTimer = 90; // environ 1.5s
}

  const theme = currentTheme();
  applyTheme(score);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y > canvas.height - groundHeight - player.size) {
    player.y = canvas.height - groundHeight - player.size;
    player.vy = 0;
  }

  if (player.angle < player.targetAngle) {
    player.angle += 9;
    if (player.angle > player.targetAngle) {
      player.angle = player.targetAngle;
    }
  }

  if (frame - lastObstacleFrame > 50 + Math.random() * 30) {
    generateObstacle();
    lastObstacleFrame = frame;
  }

  ctx.fillStyle = '#77ff77';
  ctx.shadowColor = '#bbffbb';
  ctx.shadowBlur = 15;

  obstacles.forEach((obs) => {
    obs.x -= speed;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    if (!godMode && collideRect(player, obs)) gameOver();
  });
  obstacles = obstacles.filter((obs) => obs.x + obs.width > 0);

  spikes.forEach((sp) => {
    sp.x -= speed;
    drawSpike(sp);
    if (!godMode) {
      const withinX = player.x + player.size > sp.x && player.x < sp.x + sp.size;
      const withinY = player.y + player.size > sp.y - sp.size;
      if (withinX && withinY) gameOver();
    }
  });
  spikes = spikes.filter((sp) => sp.x + sp.size > 0);

  jumpPads.forEach((pad) => {
    pad.x -= speed;
    ctx.fillStyle = '#aaffcc';
    ctx.beginPath();
    ctx.arc(pad.x + pad.size / 2, pad.y + pad.size / 2, pad.size / 2, 0, 2 * Math.PI);
    ctx.fill();
    if (
      player.x < pad.x + pad.size &&
      player.x + player.size > pad.x &&
      player.y + player.size >= pad.y
    ) {
      player.vy = player.jump * 1.3;
      player.targetAngle += 90;
    }
  });
  jumpPads = jumpPads.filter((pad) => pad.x + pad.size > 0);

  advancedTraps.forEach((trap) => {
    trap.x -= speed;
    trap.y += trap.vy;
    if (trap.y < 100 || trap.y + trap.height > canvas.height - groundHeight) {
      trap.vy *= -1;
    }
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
    if (!godMode && collideRect(player, trap)) gameOver();
  });
  advancedTraps = advancedTraps.filter((trap) => trap.x + trap.width > 0);

  drawRotatedCube(player.x, player.y, player.size, player.angle, theme.cube);

  requestAnimationFrame(gameLoop);
}

function collideRect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.size > b.x &&
    a.y < b.y + b.height &&
    a.y + a.size > b.y
  );
}

function handleJump() {
  if (player.vy === 0) {
    player.vy = player.jump;
    player.targetAngle += 90;
  }
}

function gameOver() {
  running = false;
  canvas.style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  document.getElementById('endScreen').style.display = 'block';
  document.getElementById('scoreDisplay').innerText = "Score : " + score;
  music.pause();
sfxMort.play();
  if (score > highScore) {
    localStorage.setItem("planify_highscore", score.toString());
  }
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleJump();
  if (e.key === '²') {
    godMode = !godMode;
    alert("Godmode " + (godMode ? "ON" : "OFF"));
  }
});
canvas.addEventListener('mousedown', handleJump);


// 🎚️ Gestion du volume global
let globalVolume = localStorage.getItem("planify_volume");
if (globalVolume === null) globalVolume = 0.5;
else globalVolume = parseFloat(globalVolume);

function applyVolume() {
  if (typeof music !== 'undefined') music.volume = globalVolume;
  if (typeof sfxPlay !== 'undefined') sfxPlay.volume = globalVolume;
  if (typeof sfxMort !== 'undefined') sfxMort.volume = globalVolume;
}

document.addEventListener("DOMContentLoaded", () => {
  const volumeSlider = document.getElementById("volumeControl");
  if (volumeSlider) {
    volumeSlider.value = globalVolume * 100;
    volumeSlider.addEventListener("input", () => {
      globalVolume = volumeSlider.value / 100;
      localStorage.setItem("planify_volume", globalVolume);
      applyVolume();
    });
  }
  applyVolume(); // au chargement
});


document.addEventListener("DOMContentLoaded", () => {
  const backToMenuBtn = document.getElementById("backToMenuBtn");
  const deathMenu = document.getElementById("deathMenu");
  const mainMenu = document.getElementById("menu");
  if (backToMenuBtn && deathMenu && mainMenu) {
    backToMenuBtn.addEventListener("click", () => {
      deathMenu.style.display = "none";
      mainMenu.style.display = "flex";
    });
  }
});


document.addEventListener("DOMContentLoaded", () => {
  const backToMenuBtn = document.getElementById("backToMenuBtn");
  const deathMenu = document.getElementById("deathMenu");
  const mainMenu = document.getElementById("menu");

  if (backToMenuBtn && deathMenu && mainMenu) {
    // Forcer l'affichage du bouton après la mort
    const observer = new MutationObserver(() => {
      if (deathMenu.style.display === "flex" || deathMenu.style.display === "block") {
        backToMenuBtn.style.display = "inline-block";
      }
    });

    observer.observe(deathMenu, { attributes: true, attributeFilter: ["style"] });

    backToMenuBtn.addEventListener("click", () => {
      deathMenu.style.display = "none";
      mainMenu.style.display = "flex";
    });
  }
});
