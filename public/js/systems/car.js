const CAR_MAX_LEVEL = 5;
const CAR_MAX_DIAMOND_COST = 15; // diamonds required for the final (level 5) upgrade

const CAR_PARTS = [
    { key: "engine",       label: "Motor",        icon: "⚙️",  hpPerLevel: 50, baseCost: 3000 },
    { key: "transmission", label: "Transmisión",  icon: "🔄",  hpPerLevel: 25, baseCost: 2000 },
    { key: "aero",         label: "Aerodinámica", icon: "💨",  hpPerLevel: 0,  baseCost: 2500 },
    { key: "wheels",       label: "Ruedas",       icon: "🛞",  hpPerLevel: 15, baseCost: 2000 },
];

function getCarHP() {
    const base = 350;
    return base
        + (game.car.engine       - 1) * 50
        + (game.car.transmission - 1) * 25
        + (game.car.wheels       - 1) * 15;
}

function getCarTorque() {
    return Math.round(getCarHP() * 1.36);
}

// ── tune_car(): upgrade a car part ───────────────────────────────
function tune_car(key) {
    const part = CAR_PARTS.find(p => p.key === key);
    const lvl  = game.car[key];
    if (lvl >= CAR_MAX_LEVEL) { notify("Nivel máximo alcanzado"); return; }

    const isMaxUpgrade = (lvl === CAR_MAX_LEVEL - 1);

    if (isMaxUpgrade) {
        if ((game.diamonds || 0) < CAR_MAX_DIAMOND_COST) {
            notifyWarn(`Necesitás 💎 ${CAR_MAX_DIAMOND_COST} diamantes para la mejora máxima`);
            return;
        }
        game.diamonds -= CAR_MAX_DIAMOND_COST;
    } else {
        const cost = part.baseCost * lvl;
        if (game.money < cost) { notifyWarn("Dinero insuficiente"); return; }
        game.money -= cost;
    }

    game.car[key]++;
    game.stats = game.stats || {};
    game.stats.totalUpgCar = (game.stats.totalUpgCar || 0) + 1;

    if (isMaxUpgrade) {
        notify(`${part.icon} ${part.label} al NIVEL MÁXIMO — 💎 ${CAR_MAX_DIAMOND_COST} usados`, "success");
    } else {
        notify(`${part.label} mejorado — Nivel ${game.car[key]}`, "success");
    }
    renderCarUpgrades();
    updateGarageHud();

    // FTUE progress
    if (window.FTUEManager) FTUEManager.onCarUpgraded();
    if (window.TaskManager) { TaskManager.trackDaily('upgrade'); TaskManager._updateBadge(); }
    save_user_progress();
}

function upgradePart(key) { tune_car(key); }

let dynoRunning = false;

function runDynoTest() {
    startDyno('car', getCarHP(), getCarTorque(), '🏎');
}

// Generic dyno runner with simple WebAudio engine-like sound and floating info modal
function startDyno(vehicleId, hp, torque, icon) {
    if (dynoRunning) return;
    dynoRunning = true;

    const def = (window.VEHICLE_CATALOG && VEHICLE_CATALOG[vehicleId]) || { name: 'Vehículo', icon };
    const imageMap = {
        car: 'assets/car_red.png',
        moto: 'assets/car_yellow.png',
        rally: 'assets/car_green.png',
        formula: 'assets/car_green.png'
    };
    const imageSrc = imageMap[vehicleId] || 'assets/car_red.png';
    const chartMaxHP = 1200;
    const chartMaxTQ = 1600;
    const hpY = 120 - Math.min(96, Math.round((Math.min(hp, chartMaxHP) / chartMaxHP) * 96));
    const tqY = 120 - Math.min(96, Math.round((Math.min(torque, chartMaxTQ) / chartMaxTQ) * 96));

    let interval;
    let modal = document.getElementById('dynoModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynoModal';
        modal.className = 'dyno-modal-overlay';
        modal.innerHTML = `
            <div class="dyno-modal-panel">
                <div class="dyno-modal-header">
                    <div>
                        <div class="dyno-title">Test de rendimiento</div>
                        <div class="dyno-subtitle">${def.icon || icon} ${def.name}</div>
                    </div>
                    <button class="rbtn dyno-close-btn" id="dynoCloseBtn">Cerrar</button>
                </div>
                <div class="dyno-modal-grid">
                    <div class="dyno-preview">
                        <img id="dynoVehicleImg" class="dyno-vehicle-img" src="${imageSrc}" alt="${def.name}">
                        <div class="dyno-preview-label">${def.name}</div>
                    </div>
                    <div class="dyno-sidebar">
                        <div class="dyno-graph-card">
                            <div class="dyno-graph-title">Gráfico de rendimiento</div>
                            <svg class="dyno-chart" viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 120 L20 18 L210 18" stroke="#4b5563" stroke-width="2" fill="none" opacity="0.35" />
                                <path d="M20 120 L210 ${hpY}" stroke="#3b82f6" stroke-width="4" fill="none" stroke-linecap="round" />
                                <path d="M20 120 L210 ${tqY}" stroke="#f97316" stroke-width="4" fill="none" stroke-linecap="round" />
                                <circle cx="210" cy="${hpY}" r="5" fill="#3b82f6" />
                                <circle cx="210" cy="${tqY}" r="5" fill="#f97316" />
                                <text x="24" y="18" font-size="10" fill="#9ca3af">0</text>
                                <text x="24" y="132" font-size="10" fill="#9ca3af">${chartMaxHP}</text>
                            </svg>
                            <div class="dyno-legend">
                                <span class="dyno-legend-item"><span class="legend-dot hp-dot"></span> HP</span>
                                <span class="dyno-legend-item"><span class="legend-dot tq-dot"></span> Torque</span>
                            </div>
                        </div>
                        <div class="dyno-values">
                            <div class="dyno-value-card">
                                <div class="dyno-value-label">HP actual</div>
                                <div class="dyno-value-num" id="dynoHP">0</div>
                            </div>
                            <div class="dyno-value-card">
                                <div class="dyno-value-label">Torque actual</div>
                                <div class="dyno-value-num" id="dynoTQ">0</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        (document.getElementById('app') || document.body).appendChild(modal);
        document.getElementById('dynoCloseBtn').onclick = () => {
            modal.remove();
            if (interval) clearInterval(interval);
            dynoRunning = false;
        };
    }

    const carEl = document.getElementById('dynoVehicleImg');
    const hpEl = document.getElementById('dynoHP');
    const tqEl = document.getElementById('dynoTQ');
    const title = modal.querySelector('.dyno-subtitle');
    if (title) title.textContent = `${def.icon || icon} ${def.name}`;
    if (carEl) carEl.src = imageSrc;

    let cur = 0;
    const step = Math.max(1, Math.ceil(hp / 50));

    let audioCtx, osc, gain;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        const baseFreq = 100 + Math.min(800, Math.round(hp * 0.3));
        osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.05);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.9, audioCtx.currentTime + 1.2);
    } catch (e) {
        audioCtx = null;
    }

    const interval = setInterval(() => {
        cur = Math.min(cur + step, hp);
        if (hpEl) hpEl.textContent = cur;
        if (tqEl) tqEl.textContent = Math.round(torque * (cur / hp));
        if (cur >= hp) {
            clearInterval(interval);
            setTimeout(() => {
                dynoRunning = false;
                if (audioCtx && osc && gain) {
                    gain.gain.cancelScheduledValues(audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
                    setTimeout(() => { try { osc.stop(); audioCtx.close(); } catch (e) {} }, 700);
                }
            }, 800);
        } else {
            if (audioCtx && osc) {
                const t = cur / hp;
                const freq = (100 + Math.min(800, Math.round(hp * 0.3))) * (1 + t * 1.5);
                try { osc.frequency.linearRampToValueAtTime(freq, audioCtx.currentTime + 0.1); } catch (e) {}
            }
        }
    }, 40);
}

window.startDyno = startDyno;

function renderCarUpgrades() {
    const el = document.getElementById("carContent");
    if (!el) return;

    const hp     = getCarHP();
    const torque = getCarTorque();
    const maxHP  = 350 + (CAR_MAX_LEVEL - 1) * (50 + 25 + 15);
    const hpPct  = Math.round(((hp - 350) / (maxHP - 350)) * 100);

    const partsHtml = CAR_PARTS.map(part => {
        const lvl          = game.car[part.key];
        const isMaxUpgrade = lvl === CAR_MAX_LEVEL - 1;
        const cost         = lvl < CAR_MAX_LEVEL ? (isMaxUpgrade ? null : part.baseCost * lvl) : null;
        const segs = Array.from({ length: CAR_MAX_LEVEL }, (_, i) =>
            `<div class="part-seg ${i < lvl ? "seg-on" : ""}"></div>`
        ).join("");

        let btnHtml;
        if (lvl >= CAR_MAX_LEVEL) {
            btnHtml = `<div class="part-maxed">✅ NIVEL MÁXIMO</div>`;
        } else if (isMaxUpgrade) {
            const canAfford = (game.diamonds || 0) >= CAR_MAX_DIAMOND_COST;
            btnHtml = `
                <button class="rbtn ${canAfford ? "diamond-btn" : ""}"
                        onclick="tune_car('${part.key}')"
                        ${!canAfford ? "disabled" : ""}>
                    💎 ${CAR_MAX_DIAMOND_COST} — Nivel MAX
                </button>`;
        } else {
            const canAfford = game.money >= cost;
            btnHtml = `
                <button class="rbtn ${canAfford ? "accent-btn" : ""}"
                        onclick="tune_car('${part.key}')"
                        ${!canAfford ? "disabled" : ""}>
                    Mejorar — $${cost.toLocaleString()}
                </button>`;
        }

        return `
            <div class="part-card">
                <div class="part-header">
                    <span class="part-icon">${part.icon}</span>
                    <span class="part-name">${part.label}</span>
                    <span class="part-lv">Nv.${lvl}</span>
                </div>
                <div class="part-segs">${segs}</div>
                ${btnHtml}
            </div>
        `;
    }).join("");

    el.innerHTML = `
        <div class="race-card">
            <div class="race-hero-title">🏎 AUTO DE CARRERAS</div>

            <div class="dyno-scene">
                <div class="dyno-car-wrap">
                    <span id="dynoCar" class="dyno-car-emoji">🏎</span>
                </div>
                <div class="dyno-rolls">
                    <div class="dyno-roll" id="dynoRoll1"></div>
                    <div class="dyno-roll" id="dynoRoll2"></div>
                </div>
            </div>

            <div class="dyno-readout">
                <div class="dyno-stat">
                    <div class="dyn-label">POTENCIA</div>
                    <div class="dyn-val hp-col"><span id="dynoHP">${hp}</span> <span class="dyn-unit">HP</span></div>
                </div>
                <div class="dyno-stat">
                    <div class="dyn-label">TORQUE</div>
                    <div class="dyn-val tq-col"><span id="dynoTQ">${torque}</span> <span class="dyn-unit">Nm</span></div>
                </div>
            </div>

            <div class="dyno-gauge-wrap">
                <div class="dyno-gauge-track">
                    <div class="dyno-gauge-fill" style="width:${hpPct}%"></div>
                </div>
                <div class="dyno-gauge-labels">
                    <span>350 HP</span>
                    <span>${maxHP} HP</span>
                </div>
            </div>

            <button class="rbtn" onclick="runDynoTest()">🔄 Test de rendimiento</button>
        </div>

        <div class="race-card">
            <div class="race-divider">MEJORAS DEL AUTO</div>
            ${partsHtml}
        </div>
    `;
}
