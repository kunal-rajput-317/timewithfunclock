/* -------------------------
   script.js - all behavior
   ------------------------- */

/* Utilities */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* -------------------------
   TAB HANDLING
   ------------------------- */
const tabs = $$('.tab');
const panels = $$('.panel');

tabs.forEach(t => {
  t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    const tabName = t.dataset.tab;
    panels.forEach(p => {
      p.classList.toggle('hidden', p.id !== 'tab-' + tabName);
    });
  });
});

/* -------------------------
   THEME TOGGLE (persisted)
   ------------------------- */
const themeToggle = $('#theme-toggle');
const rootEl = document.documentElement;
const THEME_KEY = 'time_master_theme';
function applyTheme(theme){
  if(theme === 'dark') rootEl.classList.add('dark');
  else rootEl.classList.remove('dark');
}
const saved = localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
applyTheme(saved);
themeToggle.addEventListener('click', () => {
  const isDark = rootEl.classList.toggle('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark':'light');
});

/* -------------------------
   ANALOG + DIGITAL CLOCK
   ------------------------- */
const analogCanvas = $('#analog-canvas');
const digitalClock = $('#digital-clock');
const ctx = analogCanvas.getContext('2d');
const size = analogCanvas.width;
const cx = size / 2;
const cy = size / 2;
const radius = size * 0.42;

function drawClock(now) {
  ctx.clearRect(0,0,size,size);
  // face
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 6, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  ctx.fill();
  // ticks
  for(let i=0;i<60;i++){
    const a = (Math.PI*2) * (i/60) - Math.PI/2;
    const r1 = radius * (i%5 === 0 ? 0.88 : 0.94);
    const r2 = radius;
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy + Math.sin(a) * r1;
    const x2 = cx + Math.cos(a) * r2;
    const y2 = cy + Math.sin(a) * r2;
    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.strokeStyle = i%5===0 ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = i%5===0 ? 3 : 1;
    ctx.stroke();
  }
  // numbers (12,3,6,9)
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = `${size*0.06}px Poppins`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('12', cx, cy - radius*0.78);
  ctx.fillText('3', cx + radius*0.78, cy);
  ctx.fillText('6', cx, cy + radius*0.78);
  ctx.fillText('9', cx - radius*0.78, cy);

  // hands
  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ms = now.getMilliseconds();

  // hour
  const hourAngle = ((h + m/60) / 12) * Math.PI*2 - Math.PI/2;
  drawHand(hourAngle, radius*0.5, 8, 'rgba(0,0,0,0.8)');
  // minute
  const minuteAngle = ((m + s/60) / 60) * Math.PI*2 - Math.PI/2;
  drawHand(minuteAngle, radius*0.72, 5, 'rgba(0,0,0,0.72)');
  // second (smooth)
  const secondAngle = ((s + ms/1000) / 60) * Math.PI*2 - Math.PI/2;
  drawHand(secondAngle, radius*0.86, 2, 'rgba(255,80,60,0.95)');

  // center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fill();

  // digital
  const pad = n => String(n).padStart(2,'0');
  digitalClock.textContent = `${pad(now.getHours())}:${pad(m)}:${pad(s)}`;
}

function drawHand(angle, len, width, color){
  const x = cx + Math.cos(angle) * len;
  const y = cy + Math.sin(angle) * len;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(x,y);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
}

/* animate clock */
function tickClock(){
  drawClock(new Date());
  requestAnimationFrame(tickClock);
}
tickClock();

/* -------------------------
   STOPWATCH Implementation
   ------------------------- */
let swStart = 0, swElapsed = 0, swTimer = null;
const swDisplay = $('#stopwatch-display');
const swStartBtn = $('#sw-start'), swStopBtn = $('#sw-stop'), swResetBtn = $('#sw-reset'), swLapBtn = $('#sw-lap'), swLaps = $('#sw-laps');

function formatStopwatch(ms){
  const minutes = Math.floor(ms/60000);
  const seconds = Math.floor((ms%60000)/1000);
  const milliseconds = ms%1000;
  return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(milliseconds).padStart(3,'0')}`;
}

function swUpdate(){
  const now = Date.now();
  const total = swElapsed + (swStart ? (now - swStart) : 0);
  swDisplay.textContent = formatStopwatch(total);
}

swStartBtn.addEventListener('click', () => {
  swStart = Date.now();
  swStartBtn.disabled = true;
  swStopBtn.disabled = false;
  swResetBtn.disabled = false;
  swLapBtn.disabled = false;
  swTimer = setInterval(swUpdate, 16);
});

swStopBtn.addEventListener('click', () => {
  if(swStart){
    swElapsed += Date.now() - swStart;
    swStart = 0;
    clearInterval(swTimer);
    swUpdate();
    swStartBtn.disabled = false;
    swStopBtn.disabled = true;
  }
});

swResetBtn.addEventListener('click', () => {
  swStart = 0; swElapsed = 0;
  clearInterval(swTimer);
  swDisplay.textContent = "00:00.000";
  swStartBtn.disabled = false;
  swStopBtn.disabled = true;
  swResetBtn.disabled = true;
  swLapBtn.disabled = true;
  swLaps.innerHTML = '';
});

swLapBtn.addEventListener('click', () => {
  const nowTotal = swElapsed + (swStart ? (Date.now() - swStart) : 0);
  const li = document.createElement('li');
  li.textContent = formatStopwatch(nowTotal);
  swLaps.prepend(li);
});

/* -------------------------
   TIMER Implementation
   ------------------------- */
const tMin = $('#timer-min'), tSec = $('#timer-sec');
const tDisplay = $('#timer-display');
const tStart = $('#timer-start'), tPause = $('#timer-pause'), tReset = $('#timer-reset');

let timerRemaining = 0, timerInterval = null, timerRunning = false;

function updateTimerDisplay(ms){
  ms = Math.max(0, ms);
  const totalSec = Math.ceil(ms/1000);
  const mm = Math.floor(totalSec/60);
  const ss = totalSec % 60;
  tDisplay.textContent = `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

tStart.addEventListener('click', () => {
  const minutes = Math.max(0, parseInt(tMin.value||'0',10));
  const seconds = Math.max(0, Math.min(59, parseInt(tSec.value||'0',10)));
  timerRemaining = (minutes*60 + seconds) * 1000;
  if(timerRemaining <= 0) return;
  startTimer();
});

function startTimer(){
  if(timerRunning) return;
  const startTs = Date.now();
  timerRunning = true;
  tStart.disabled = true;
  tPause.disabled = false;
  tReset.disabled = false;
  const tick = () => {
    const delta = Date.now() - startTs;
    timerRemaining -= delta;
    if(timerRemaining <= 0){
      updateTimerDisplay(0);
      finishTimer();
    } else {
      updateTimerDisplay(timerRemaining);
      // schedule next tick
      setTimeout(() => requestAnimationFrame(tick), 200);
    }
  };
  // we implement using a small loop with updated startTs logic:
  let last = Date.now();
  timerInterval = setInterval(() => {
    const now = Date.now();
    const diff = now - last;
    last = now;
    timerRemaining -= diff;
    if(timerRemaining <= 0){
      updateTimerDisplay(0);
      clearInterval(timerInterval);
      finishTimer();
    } else updateTimerDisplay(timerRemaining);
  }, 200);
  timerRunning = true;
}

tPause.addEventListener('click', () => {
  if(timerInterval) clearInterval(timerInterval);
  timerRunning = false;
  tStart.disabled = false;
  tPause.disabled = true;
});

tReset.addEventListener('click', () => {
  if(timerInterval) clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = 0;
  updateTimerDisplay(0);
  tStart.disabled = false;
  tPause.disabled = true;
  tReset.disabled = true;
});

/* when timer finishes */
function finishTimer(){
  timerRunning = false;
  tStart.disabled = false;
  tPause.disabled = true;
  tReset.disabled = false;
  // visual cue
  flashBackground();
  // small sound if available
  try{
    const beep = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
    beep.play().catch(()=>{});
  }catch(e){}
  alert('Timer finished');
}

function flashBackground(){
  const body = document.body;
  const orig = body.style.boxShadow;
  body.animate([
    { boxShadow: 'inset 0 0 150px rgba(255,255,255,0.25)' },
    { boxShadow: 'none' }
  ], {duration:700});
}

/* -------------------------
   SAND/HOURGLASS Implementation
   ------------------------- */
const hourglass = $('#hourglass');
const sandTop = hourglass.querySelector('.sand-top');
const sandBottom = hourglass.querySelector('.sand-bottom');
const sandStartBtn = $('#sand-start');
const sandResetBtn = $('#sand-reset');
const sandStatus = $('#sand-status');

let sandRunning = false;
let sandTimerRef = null;

sandStartBtn.addEventListener('click', () => {
  if(sandRunning) return;
  startSand();
});

sandResetBtn.addEventListener('click', resetSand);

function startSand(){
  // Flip animation concept: run 30s sand
  hourglass.classList.add('running');
  sandTop.classList.add('running');
  sandBottom.classList.add('running');
  hourglass.insertAdjacentHTML('beforeend','<div class="sand-neck-stream"></div>');
  sandStatus.textContent = 'Running';
  sandRunning = true;
  sandStartBtn.disabled = true;
  sandResetBtn.disabled = false;
  // After 30s, finish
  sandTimerRef = setTimeout(() => {
    sandFinish();
  }, 30000);
}

function sandFinish(){
  hourglass.classList.remove('running');
  sandTop.classList.remove('running');
  sandBottom.classList.remove('running');
  const stream = hourglass.querySelector('.sand-neck-stream');
  if(stream) stream.remove();
  sandStatus.textContent = 'Done';
  sandRunning = false;
  sandStartBtn.disabled = false;
}

function resetSand(){
  if(sandTimerRef) { clearTimeout(sandTimerRef); sandTimerRef = null; }
  hourglass.classList.remove('running');
  sandTop.classList.remove('running');
  sandBottom.classList.remove('running');
  const stream = hourglass.querySelector('.sand-neck-stream');
  if(stream) stream.remove();
  sandStatus.textContent = 'Ready';
  sandStartBtn.disabled = false;
}

/* -------------------------
   Accessibility small helpers
   ------------------------- */
/* keyboard navigation for tabs */
tabs.forEach((t,i) => {
  t.addEventListener('keydown', (ev) => {
    if(ev.key === 'ArrowRight' || ev.key === 'ArrowDown'){
      ev.preventDefault();
      const next = tabs[(i+1)%tabs.length];
      next.focus();
      next.click();
    } else if(ev.key === 'ArrowLeft' || ev.key === 'ArrowUp'){
      ev.preventDefault();
      const prev = tabs[(i-1+tabs.length)%tabs.length];
      prev.focus();
      prev.click();
    }
  });
});

/* -------------------------
   On-load: set sensible defaults
   ------------------------- */
updateTimerDisplay(0);
tPause.disabled = true;
tReset.disabled = true;
swStopBtn.disabled = true;
swResetBtn.disabled = true;
swLapBtn.disabled = true;
