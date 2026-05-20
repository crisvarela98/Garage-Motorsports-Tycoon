// ── FTUE v2 — Arrow-guided tutorial, name asked AFTER playing ─────
// Flow: auto-start on first run (step 0→1 immediately, no name needed)
// Step 1: Receive a car (→ #recieveCarBtn)
// Step 2: Hire a mechanic (→ .hud-staff-btn)
// Step 3: Mejorar el auto (→ #workshopBtn)
// Step 4: Correr (→ .lfab-carrera)
// Step 5: Usar el camión (→ #truckFabBtn)
// Step 6: Nombre y completar tutorial

const FTUEManager = (() => {
    const CONTROL_BUTTONS = [
        { selector: '#recieveCarBtn',   showAt: 1 },
        { selector: '.hud-staff-btn',   showAt: 2 },
        { selector: '#workshopBtn',     showAt: 3 },
        { selector: '.lfab-carrera',    showAt: 4 },
        { selector: '#truckFabBtn',     showAt: 5 },
        { selector: '#tataFloatBtn',    showAt: 4 },
        { selector: '.hud-sponsor-btn', showAt: 6 },
        { selector: '.hud-store-btn',   showAt: 6 },
        { selector: '#tasksFab',        showAt: 6 },
    ];

    function _hideAllTutorialButtons() {
        CONTROL_BUTTONS.forEach(({ selector }) => {
            document.querySelectorAll(selector).forEach(el => el.classList.add('ftue-hidden'));
        });
    }

    function _updateTutorialButtons(step) {
        CONTROL_BUTTONS.forEach(({ selector, showAt }) => {
            document.querySelectorAll(selector).forEach(el => {
                el.classList.toggle('ftue-hidden', step < showAt);
            });
        });
    }

    // ── Step definitions ──────────────────────────────────────────
    const STEPS = [
        {
            step:    1,
            msg:     "🚗 Recibí tu primer cliente",
            sub:     "Tocá este botón para aceptar un auto que necesita reparación. Cada auto arreglado te da dinero y experiencia para crecer.",
            target:  "#recieveCarBtn",
            arrowDir: "down",
            dots:    [true, false, false, false, false]
        },
        {
            step:    2,
            msg:     "👨‍🔧 Contratá un mecánico",
            sub:     "Un mecánico trabaja solo mientras vos gestionás el taller. Elegí un Junior para empezar rápido y ganar tiempo.",
            target:  ".hud-staff-btn",
            arrowDir: "up",
            dots:    [true, true, false, false, false]
        },
        {
            step:    3,
            msg:     "🔧 Mejorá tu auto",
            sub:     "Entrá al taller y mejorá una parte del auto. Esto lo hace más rápido en carreras y te ayuda a ganar más dinero.",
            target:  "#workshopBtn",
            arrowDir: "down",
            dots:    [true, true, true, false, false]
        },
        {
            step:    4,
            msg:     "🏁 Prepará tu primera carrera",
            sub:     "Tocá Carrera para abrir el menú de pistas. Ahí podrás elegir tu auto y empezar la clasificación.",
            target:  ".lfab-carrera",
            arrowDir: "down",
            dots:    [true, true, true, true, false]
        },
        {
            step:    5,
            msg:     "🚛 Probá el camión ciudad",
            sub:     "Abre el minijuego del camión y esquivá el tráfico. Es una forma divertida y rápida de ganar dinero extra.",
            target:  "#truckFabBtn",
            arrowDir: "right",
            dots:    [true, true, true, true, true]
        }
    ];

    // Level tips shown after FTUE is done
    const LEVEL_TIPS = {
        5:  { title: '¡Moto desbloqueada pronto!', hint: 'Al nivel 5 desbloqueás la Moto de Carreras. Empezá a ahorrar.' },
        10: { title: '¡Mejorá el taller!',         hint: 'Tocá 🔧 Taller → Garage. Las Herramientas Pro aceleran reparaciones.' },
        15: { title: '¡Conseguí un sponsor!',     hint: 'Tocá 💰 Sponsors arriba. Un sponsor te da más dinero en cada carrera.' },
        20: { title: '¡Completá tus tareas!',       hint: 'Tocá 🎯 arriba a la derecha. Las tareas diarias te dan XP gratis.' },
    };

    const VEHICLE_TIPS = {
        moto:    { title: '¡Moto desbloqueada! 🏍',    hint: 'La moto tiene su propia liga. Mejorá el Motor antes de la primera carrera.' },
        rally:   { title: '¡Camioneta Rally! 🚙',       hint: 'Terreno, barro, grava — la Rally lo maneja todo.' },
        formula: { title: '¡Fórmula desbloqueada! 🏎', hint: 'La categoría reina del automovilismo. Tiene pit stop obligatorio.' },
    };

    // ── State helpers ─────────────────────────────────────────────
    function step()   { return game.ftue ? game.ftue.step   : 0; }
    function isDone() { return game.ftue && game.ftue.completed; }

    let _continueEnabled = false;
    function _setContinueState(enabled) {
        _continueEnabled = enabled;
        const btn = document.getElementById('ftueContinueBtn');
        if (btn) {
            btn.disabled = !enabled;
            btn.textContent = 'Continuar';
        }
    }

    function _markStepCompleted() {
        _setContinueState(true);
        const hintEl = document.querySelector('.ftue-bubble-hint');
        if (hintEl) {
            hintEl.textContent = '¡Tarea completada! Presioná Continuar para seguir.';
        }
    }

    // ── Overlay element ───────────────────────────────────────────
    function _getOverlay() {
        let el = document.getElementById('ftue-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'ftue-overlay';
            const app = document.getElementById('app') || document.body;
            app.appendChild(el);
        }
        return el;
    }

    function _isVisibleElement(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }

    // ── Position the arrow pointing at a CSS-selector element ─────
    function _positionArrow(targetSel, dir) {
        const arrow = document.getElementById('ftue-arrow');
        if (!arrow) return;

        const targetEl = document.querySelector(targetSel);
        if (!_isVisibleElement(targetEl)) { arrow.style.display = 'none'; return; }

        const appEl  = document.getElementById('app') || document.body;
        const appRect = appEl.getBoundingClientRect();
        const tRect   = targetEl.getBoundingClientRect();

        // center of target relative to #app
        const cx = tRect.left - appRect.left + tRect.width  / 2;
        const cy = tRect.top  - appRect.top  + tRect.height / 2;

        arrow.style.display  = 'flex';
        arrow.style.position = 'absolute';

        if (dir === 'down') {
            // arrow floats ABOVE the target, pointing down
            arrow.innerHTML   = '▼';
            arrow.style.left  = (cx - 16) + 'px';
            arrow.style.top   = (cy - tRect.height / 2 - 44) + 'px';
        } else if (dir === 'up') {
            // arrow floats BELOW the target, pointing up
            arrow.innerHTML   = '▲';
            arrow.style.left  = (cx - 16) + 'px';
            arrow.style.top   = (cy + tRect.height / 2 + 10) + 'px';
        } else if (dir === 'right') {
            // arrow floats to the LEFT of the target, pointing right
            arrow.innerHTML   = '▶';
            arrow.style.left  = (tRect.left - appRect.left - 44) + 'px';
            arrow.style.top   = (cy - 16) + 'px';
        } else {
            // left — arrow floats to the RIGHT, pointing left
            arrow.innerHTML   = '◀';
            arrow.style.left  = (tRect.right - appRect.left + 10) + 'px';
            arrow.style.top   = (cy - 16) + 'px';
        }
    }

    // ── Render a tutorial step ────────────────────────────────────
    function _show(s) {
        const el = _getOverlay();

        const dotsHtml = s.dots
            .map(active => `<div class="ftue-dot${active ? ' ftue-dot-active' : ''}"></div>`)
            .join('');

        el.innerHTML = `
        <div id="ftue-arrow" class="ftue-arrow-el"></div>
        <div class="ftue-panel">
            <div class="ftue-bubble">
                <div class="ftue-bubble-name">🦁 TATA LION</div>
                <div class="ftue-bubble-title">${s.msg}</div>
                <div class="ftue-bubble-hint">${s.sub}</div>
                <div class="ftue-bubble-footer">
                    <div class="ftue-dots">${dotsHtml}</div>
                    <div class="ftue-footer-right">
                        <button class="ftue-next-btn" id="ftueContinueBtn" disabled onclick="FTUEManager.confirmStep()">Completa la tarea</button>
                    </div>
                </div>
            </div>
            <div class="ftue-character">
                <img src="assets/tata-lion.png" alt="Tata Lion">
            </div>
        </div>`;

        el.classList.add('ftue-visible');
        _setContinueState(false);

        const panel = el.querySelector('.ftue-panel');
        const targetEl = document.querySelector(s.target);
        if (!_isVisibleElement(targetEl)) {
            panel?.classList.add('ftue-panel--floating');
        } else {
            panel?.classList.remove('ftue-panel--floating');
        }

        // Position arrow after DOM paint
        requestAnimationFrame(() => {
            _positionArrow(s.target, s.arrowDir);
        });
    }

    function _showTip(title, hint) {
        const el = _getOverlay();
        el.innerHTML = `
        <div class="ftue-panel">
            <div class="ftue-bubble">
                <div class="ftue-bubble-name">🦁 TATA LION</div>
                <div class="ftue-bubble-title">${title}</div>
                <div class="ftue-bubble-hint">${hint}</div>
                <div class="ftue-bubble-footer">
                    <div class="ftue-dots"></div>
                    <div class="ftue-footer-right">
                        <button class="ftue-next-btn" id="ftueNextBtn" onclick="FTUEManager.closeTip()">¡Entendido!</button>
                    </div>
                </div>
            </div>
            <div class="ftue-character">
                <img src="assets/tata-lion.png" alt="Tata Lion">
            </div>
        </div>`;
        el.classList.add('ftue-visible');
    }

    function _hide() {
        const el = document.getElementById('ftue-overlay');
        if (el) {
            el.classList.remove('ftue-visible');
            setTimeout(() => { if (el.parentNode) el.remove(); }, 320);
        }
    }

    let _taskInProgress = false;
    let _taskStepPending = null;

    function _hideDuringTask() {
        _taskInProgress = true;
        _taskStepPending = step();
        _hide();
    }

    function _resumeAfterTask() {
        if (!_taskInProgress || _taskStepPending !== step()) return;
        _taskInProgress = false;
        _taskStepPending = null;
        const s = STEPS.find(x => x.step === step());
        if (!s) return;
        _show(s);
        _markStepCompleted();
    }

    // ── Advance to next step ──────────────────────────────────────
    function advance(to) {
        if (isDone() || to <= step()) return;
        game.ftue.step = to;
        _updateTutorialButtons(to);

        // After step 5 (truck minigame) → show name modal instead of continuing
        if (to === 6) {
            _hide();
            save_user_progress();
            // Small delay so minigame close animation finishes
            setTimeout(() => _showNameModal(), 600);
            return;
        }

        if (to > 6) {
            game.ftue.completed = true;
            _hide();
            notifySuccess("🏆 ¡Tutorial completo! Nos vemos en la pista. 🦁");
            save_user_progress();
            return;
        }

        const s = STEPS.find(x => x.step === to);
        if (s) _show(s);
        save_user_progress();
    }

    // ── Name modal shown AFTER tutorial ──────────────────────────
    function _showNameModal() {
        if (document.getElementById('ftue-name-modal')) return;

        const overlay = document.createElement('div');
        overlay.id        = 'ftue-name-modal';
        overlay.className = 'profile-modal-overlay';
        overlay.innerHTML = `
        <div class="profile-modal">
            <div class="pm-tata-row">
                <img src="assets/tata-lion.png" class="pm-tata-img" alt="Tata Lion">
                <div class="pm-tata-speech">
                    <div class="pm-speech-from">🦁 Tata Lion</div>
                    <div class="pm-speech-text">¡Excelente trabajo. Antes de continuar, quiero saber cómo te llamás y cómo querés llamar a tu taller.</div>
                </div>
            </div>
                <label class="profile-label">Tu nombre</label>
                <input class="profile-input" id="ftuePlayerName" placeholder="Ej: Carlos" maxlength="24">
                <div class="profile-note">Este será tu nombre dentro del juego.</div>

                <label class="profile-label">Edad</label>
                <select id="ftuePlayerAge" class="profile-input">
                    <option value="">Seleccioná tu edad</option>
                    ${Array.from({length:63},(_,i)=>`<option value="${i+13}">${i+13}</option>`).join('')}
                </select>

                <label class="profile-label">Nombre de tu garage</label>
                <input class="profile-input" id="ftueGarageName" placeholder="Ej: Scuderia Veloz" maxlength="32">
                <div class="profile-note">Poné un nombre único para tu taller. Podés cambiarlo después.</div>

                <div style="margin-top:8px;display:flex;gap:8px;flex-direction:column">
                    <div>
                        <button class="rbtn" id="ftueFollowBtn" onclick="FTUEManager.openInstagramFollow()">Seguir en Instagram (@tatalion_game)</button>
                    </div>
                    <div style="font-size:12px;color:#777">Se abrirá la autorización de Instagram. Al regresar, recibirás 50 diamantes automático si el proceso se completa.</div>
                </div>

                <button class="rbtn accent-btn pm-start-btn" onclick="FTUEManager.submitName()">🏁 Guardar y empezar</button>
        </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => { const i = document.getElementById('ftuePlayerName'); if (i) i.focus(); }, 100);
    }

    function submitName() {
        const n = document.getElementById('ftuePlayerName');
        const g = document.getElementById('ftueGarageName');
        game.playerName = (n && n.value.trim()) || 'Jugador';
        game.garageName = (g && g.value.trim()) || 'Mi Garage';

        const ageEl = document.getElementById('ftuePlayerAge');
        if (ageEl && ageEl.value) game.playerAge = parseInt(ageEl.value, 10);

        const modal = document.getElementById('ftue-name-modal');
        if (modal) modal.remove();

        game.ftue = { completed: true, step: 6 };
        save_user_progress();
        updateGarageHud();
        notifySuccess("🏆 ¡Tutorial completo! Nos vemos en la pista. 🦁");
    }

    // ── Tips after FTUE ───────────────────────────────────────────
    const _storyTips = [
        { title: '💡 Consejo de Tata Lion', hint: 'El dinero offline sigue corriendo aunque cierres el juego. ¡Volvé seguido!' },
        { title: '🏁 Tip de carrera',        hint: 'Mejorá el Motor para ganar más carreras desde el principio.' },
        { title: '💰 Maximizá ingresos',     hint: 'Sponsors + Mecánicos + Reparaciones = dinero constante.' },
        { title: '📺 Videos gratis',          hint: 'Ver un video te da 2 diamantes. ¡Acumula para contratar Ingenieros Pro!' },
        { title: '🎯 Tareas diarias',         hint: 'Las tareas del 🎯 se resetean cada día. Son la forma más fácil de ganar XP.' },
        { title: '🚛 Minijuego',              hint: 'El camión da $150 por segundo. ¡En 30 segundos podés ganar $4,500!' },
        { title: '⭐ Autos Estrella',         hint: 'Los autos raros (⭐) pagan $1,800+ pero tardan más. Un video los completa al instante.' },
        { title: '🔧 Ahorra piezas',         hint: 'Subí Stock de repuestos para reducir tiempos de reparación.' },
        { title: '🕒 Gestión de tiempo',     hint: 'Prioriza tareas y repasos rápidos para mantener flujo de ingresos.' },
        { title: '📈 Reputación',            hint: 'La reputación te ayuda a conseguir mejores rivales y ofertas de sponsor.' }
    ];
    let _tipIdx = 0;
    function _showRandomTip() {
        const tip = _storyTips[_tipIdx % _storyTips.length];
        _tipIdx++;
        _showTip(tip.title, tip.hint);
    }

    // ── Public API ────────────────────────────────────────────────
    function init() {
        if (!game.ftue) game.ftue = { completed: false, step: 0 };

        if (isDone()) {
            _updateTutorialButtons(6);
            return;
        }

        // First time ever — start immediately without asking name
        if (step() === 0) {
            game.ftue.step = 1;
            save_user_progress();
        }

        _hideAllTutorialButtons();
        _updateTutorialButtons(step());

        const s = STEPS.find(x => x.step === step());
        if (s) {
            // Short delay so garage finishes rendering
            setTimeout(() => _show(s), 500);
        }
    }

    function confirmStep() {
        if (!_continueEnabled) return;
        advance(step() + 1);
    }

    function tataPress() {
        if (!isDone()) {
            const s = STEPS.find(x => x.step === step());
            if (s) _show(s);
        } else {
            _showRandomTip();
        }
    }

    function closeTip() { _hide(); }

    return {
        init,
        confirmStep,
        submitName,
        closeTip,
        tataPress,
        isCompleted: isDone,
        currentStep: step,
        showTip: _showTip,

        // Instagram follow helpers
        openInstagramFollow() {
            // Redirect to server OAuth start with device id
            try {
                const deviceId = (window.CloudSave && CloudSave.getDeviceId()) || '';
                window.location.href = '/auth/instagram?device_id=' + encodeURIComponent(deviceId);
            } catch (e) {
                try { window.open('https://instagram.com/tatalion_game', '_blank'); } catch(e){}
            }
        },

        // Event hooks called from game modules
        onProfileSaved()  { /* name is now asked at end, not start */ },
        onCarReceived()   { if (step() === 1) setTimeout(() => _markStepCompleted(), 1200); },
        onMechanicHired() { if (step() === 2) setTimeout(() => _markStepCompleted(), 1200); },
        onCarUpgraded()   { if (step() === 3) setTimeout(() => _markStepCompleted(), 1200); },
        onRaceStarted()   { if (step() === 4) _hideDuringTask(); },
        onRaceCompleted() { if (step() === 4) setTimeout(() => _resumeAfterTask(), 300); },
        onGarageUpgradePurchased() { },
        onMinigameStarted() { if (step() === 5) _hideDuringTask(); },
        onMinigameEnded() { if (step() === 5) setTimeout(() => _resumeAfterTask(), 300); },
        onRaceScreenOpened() { if (step() === 4 || step() === 5) { _hide(); _taskInProgress = true; _taskStepPending = step(); } },

        onVehicleUnlocked(vehicleId) {
            const tip = VEHICLE_TIPS[vehicleId];
            if (tip) _showTip(tip.title, tip.hint);
        },
        onLevelUp(level) {
            const tip = LEVEL_TIPS[level];
            if (tip) _showTip(tip.title, tip.hint);
        },
    };
})();

window.FTUEManager = FTUEManager;
