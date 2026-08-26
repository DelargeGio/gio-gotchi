let audioCtx = null;
function playBeep(freq, type, duration) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq || 440;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}

function speakRobot(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    let utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 0.5;
    utterance.rate = 1.1;
    utterance.lang = 'es-MX';
    window.speechSynthesis.speak(utterance);
  }
}

let ganjaPlans = JSON.parse(localStorage.getItem("gio_v9_ganja")) || [{ text: "Último gallo registrado", done: false }];
let schedule = JSON.parse(localStorage.getItem("gio_v9_sched")) || [{ text: "Bloque principal de trabajo", done: false }];
let tasks = JSON.parse(localStorage.getItem("gio_v9_tasks")) || [{ text: "Revisar pendientes de casa", done: false }];
let petTasks = JSON.parse(localStorage.getItem("gio_v9_pet")) || [{ text: "Comida y agua para Miclo", done: false }];
let fitness = JSON.parse(localStorage.getItem("gio_v9_fit")) || [{ text: "Actividad física", done: false }];
let finances = JSON.parse(localStorage.getItem("gio_v9_fin")) || [{ desc: "Gastos / Deudas", amount: 0 }];
let scratchpadText = localStorage.getItem("gio_v9_scratch") || "";
let lastGanjaTime = Number(localStorage.getItem("gio_v9_lastGanja")) || Date.now();

const themes = [
  { id: "acid", name: "Neón: Acid" },
  { id: "cyberpunk", name: "Neón: Cyber" },
  { id: "matrix", name: "Neón: Matrix" },
  { id: "electric", name: "Neón: Electric" },
  { id: "night", name: "Modo: Night" }
];
let currentThemeIdx = Number(localStorage.getItem("gio_v9_themeIdx")) || 0;
let manualFaceIndex = localStorage.getItem("gio_v9_face") !== null ? Number(localStorage.getItem("gio_v9_face")) : -1;
let startDate = localStorage.getItem("gio_v9_start") || new Date().toISOString();
localStorage.setItem("gio_v9_start", startDate);

const faces = [
  { face: "^‿^", text: "SISTEMA ÓPTIMO" },
  { face: "¬‿¬", text: "RITMO ACTIVO" },
  { face: "•_•;", text: "ENFOQUE TOTAL" },
  { face: "ò_ó", text: "MODO GUERRERO" }
];

function applySettings() {
  let body = document.getElementById("bodyRoot");
  body.className = "";
  body.classList.add("theme-" + themes[currentThemeIdx].id);
  document.getElementById("themeNameBtn").innerText = themes[currentThemeIdx].name;
}

function cycleTheme() {
  currentThemeIdx = (currentThemeIdx + 1) % themes.length;
  localStorage.setItem("gio_v9_themeIdx", currentThemeIdx);
  applySettings();
}

function cycleAvatarExpression() {
  manualFaceIndex = (manualFaceIndex + 1) % faces.length;
  localStorage.setItem("gio_v9_face", manualFaceIndex);
  updateApp();
}

function resetGanjaTimer() {
  lastGanjaTime = Date.now();
  localStorage.setItem("gio_v9_lastGanja", lastGanjaTime);
  playBeep(400, 'square', 0.1);
  speakRobot("Contador reiniciado. Arrancando nueva pausa.");
  updateApp();
}

setInterval(() => {
  let d = new Date();
  let timeStr = d.toTimeString().split(' ')[0];
  let clockEl = document.getElementById("lcdClock");
  if (clockEl) clockEl.innerText = timeStr;

  let diff = Math.floor((Date.now() - lastGanjaTime) / 1000);
  let hrs = Math.floor(diff / 3600);
  let mins = Math.floor((diff % 3600) / 60);
  let secs = diff % 60;
  let timerStr = `${String(hrs).padStart(2,'0')}h ${String(mins).padStart(2,'0')}m ${String(secs).padStart(2,'0')}s`;
  let timerEl = document.getElementById("ganjaTimer");
  if (timerEl) timerEl.innerText = timerStr;
}, 1000);

function saveScratchpad() {
  let content = document.getElementById("scratchpadArea").value;
  localStorage.setItem("gio_v9_scratch", content);
}

function updateApp() {
  localStorage.setItem("gio_v9_ganja", JSON.stringify(ganjaPlans));
  localStorage.setItem("gio_v9_sched", JSON.stringify(schedule));
  localStorage.setItem("gio_v9_tasks", JSON.stringify(tasks));
  localStorage.setItem("gio_v9_pet", JSON.stringify(petTasks));
  localStorage.setItem("gio_v9_fit", JSON.stringify(fitness));
  localStorage.setItem("gio_v9_fin", JSON.stringify(finances));

  let start = new Date(startDate);
  let streak = Math.floor(Math.abs(new Date() - start) / (1000 * 60 * 60 * 24)) + 1;
  document.getElementById("lcdStreak").innerText = `🌿 D${streak}`;

  let totalDone = ganjaPlans.filter(w=>w.done).length + schedule.filter(s=>s.done).length + tasks.filter(t=>t.done).length + petTasks.filter(p=>p.done).length + fitness.filter(f=>f.done).length;
  let totalItems = ganjaPlans.length + schedule.length + tasks.length + petTasks.length + fitness.length;
  let dayPct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 100;

  document.getElementById("dayFill").style.width = dayPct + "%";
  document.getElementById("lcdBadge").innerText = dayPct >= 70 ? "ENFOQUE AL TOPE" : "MODO ACTIVO";

  let avFace = document.getElementById("avFace");
  let avText = document.getElementById("avatarStatusText");
  if (manualFaceIndex !== -1) {
    avFace.innerText = faces[manualFaceIndex].face;
    avText.innerText = faces[manualFaceIndex].text;
  } else {
    if (dayPct >= 75) { avFace.innerText = "^‿^"; avText.innerText = "SISTEMA ÓPTIMO"; }
    else if (dayPct >= 40) { avFace.innerText = "¬‿¬"; avText.innerText = "RITMO ACTIVO"; }
    else { avFace.innerText = "•_•;"; avText.innerText = "ENFOQUE TOTAL"; }
  }

  renderList("ganjaList", ganjaPlans, "toggleGanja", "deleteGanja");
  renderList("scheduleList", schedule, "toggleSched", "deleteSched");
  renderList("taskList", tasks, "toggleTask", "deleteTask");
  renderList("petList", petTasks, "togglePet", "deletePet");
  renderList("fitnessList", fitness, "toggleFitness", "deleteFitness");
  renderFinanceList();

  let scratchArea = document.getElementById("scratchpadArea");
  if (scratchArea && scratchArea.value !== scratchpadText && document.activeElement !== scratchArea) {
    scratchArea.value = scratchpadText;
  }
}

function renderList(elementId, items, toggleFn, deleteFn) {
  let html = "";
  if (items.length === 0) {
    document.getElementById(elementId).innerHTML = '<div style="color:var(--dim); text-align:center; font-size:0.58rem; padding:4px;">Sin registros.</div>';
    return;
  }
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    html += `
      <div class="task-item ${item.done ? 'done' : ''}">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:4px;">${item.text}</span>
        <div style="flex-shrink:0;">
          <button class="btn-sm ${item.done ? 'done-btn' : ''}" onclick="playBeep(880, 'sine', 0.04); ${toggleFn}(${i})">${item.done ? 'OK' : 'Hecho'}</button>
          <button class="btn-sm del-btn" onclick="playBeep(200, 'sawtooth', 0.05); ${deleteFn}(${i})">X</button>
        </div>
      </div>
    `;
  }
  document.getElementById(elementId).innerHTML = html;
}

function renderFinanceList() {
  let html = "";
  if (finances.length === 0) {
    document.getElementById("financeList").innerHTML = '<div style="color:var(--dim); text-align:center; font-size:0.58rem; padding:4px;">Sin registros.</div>';
    return;
  }
  for (let i = 0; i < finances.length; i++) {
    let fn = finances[i];
    html += `
      <div class="task-item">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:4px;">${fn.desc}</span>
        <div style="flex-shrink:0;">
          <b style="color:var(--neon-pink); font-size:0.6rem; margin-right:4px;">$${fn.amount}</b>
          <button class="btn-sm del-btn" onclick="playBeep(200, 'sawtooth', 0.05); deleteFinance(${i})">X</button>
        </div>
      </div>
    `;
  }
  document.getElementById("financeList").innerHTML = html;
}

function switchTab(tabName, btn) {
  document.querySelectorAll('.panel-view').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.device-buttons .pill-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabName).classList.add('active');
  btn.classList.add('active');
}

function addGanjaPlan() {
  let input = document.getElementById("ganjaInput");
  if (!input.value.trim()) return;
  ganjaPlans.push({ text: input.value.trim(), done: false });
  input.value = "";
  updateApp();
}
function toggleGanja(i) { ganjaPlans[i].done = !ganjaPlans[i].done; if(ganjaPlans[i].done) speakRobot("Meta cumplida."); updateApp(); }
function deleteGanja(i) { ganjaPlans.splice(i, 1); updateApp(); }

function addSchedule() {
  let input = document.getElementById("schedInput");
  if (!input.value.trim()) return;
  schedule.push({ text: input.value.trim(), done: false });
  input.value = "";
  updateApp();
}
function toggleSched(i) { schedule[i].done = !schedule[i].done; if(schedule[i].done) speakRobot("Bloque completado."); updateApp(); }
function deleteSched(i) { schedule.splice(i, 1); updateApp(); }

function addTask() {
  let input = document.getElementById("taskInput");
  if (!input.value.trim()) return;
  tasks.push({ text: input.value.trim(), done: false });
  input.value = "";
  updateApp();
}
function toggleTask(i) { tasks[i].done = !tasks[i].done; if(tasks[i].done) speakRobot("Tarea de hogar lista."); updateApp(); }
function deleteTask(i) { tasks.splice(i, 1); updateApp(); }

function addPetTask() {
  let input = document.getElementById("petInput");
  if (!input.value.trim()) return;
  petTasks.push({ text: input.value.trim(), done: false });
  input.value = "";
  updateApp();
}
function togglePet(i) { petTasks[i].done = !petTasks[i].done; if(petTasks[i].done) speakRobot("Cuidado de Miclo registrado."); updateApp(); }
function deletePet(i) { petTasks.splice(i, 1); updateApp(); }

function addFitness() {
  let input = document.getElementById("fitnessInput");
  if (!input.value.trim()) return;
  fitness.push({ text: input.value.trim(), done: false });
  input.value = "";
  updateApp();
}
function toggleFitness(i) { fitness[i].done = !fitness[i].done; if(fitness[i].done) speakRobot("Entrenamiento finalizado."); updateApp(); }
function deleteFitness(i) { fitness.splice(i, 1); updateApp(); }

function addFinance() {
  let desc = document.getElementById("finDesc");
  let amount = document.getElementById("finAmount");
  if (!desc.value.trim() || !amount.value) return;
  finances.push({ desc: desc.value.trim(), amount: Number(amount.value) });
  desc.value = "";
  amount.value = "";
  updateApp();
}
function deleteFinance(i) { finances.splice(i, 1); updateApp(); }

function resetDevice() {
  if(confirm("¿Reiniciar sistema?")) {
    playBeep(150, 'sawtooth', 0.2);
    localStorage.clear();
    location.reload();
  }
}

applySettings();
updateApp();
