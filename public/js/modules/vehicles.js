// ── Vehicle Catalog ───────────────────────────────────────────────

const VEHICLE_CATALOG = {
    car: {
        id:           "car",
        name:         "Auto de Taller",
        icon:         "🚗",
        color:        "#3b82f6",
        unlockLevel:  1,
        leagueId:     null,
        basePace:     92,
        baseStats:    { hp: 250, torque: 340, cv: 253 },
        lapLabel:     "Vuelta",
        totalLaps:    20,
        desc:         "El punto de partida. Versátil y fácil de mejorar."
    },
    moto: {
        id:           "moto",
        name:         "Moto de Carreras",
        icon:         "🏍",
        color:        "#f97316",
        unlockLevel:  5,
        leagueId:     "moto",
        basePace:     65,
        baseStats:    { hp: 200, torque: 120, cv: 203 },
        lapLabel:     "Vuelta",
        totalLaps:    20,
        desc:         "Rápida y ágil. Requiere precisión en cada curva."
    },
    rally: {
        id:           "rally",
        name:         "Camioneta Rally",
        icon:         "🚙",
        color:        "#22c55e",
        unlockLevel:  20,
        leagueId:     "rally",
        basePace:     105,
        baseStats:    { hp: 450, torque: 610, cv: 456 },
        lapLabel:     "Etapa",
        totalLaps:    10,
        desc:         "Potencia bruta en terreno agreste. La bestia del off-road."
    },
    formula: {
        id:           "formula",
        name:         "Monoplaza Fórmula",
        icon:         "🏎",
        color:        "#e11d48",
        unlockLevel:  40,
        leagueId:     "formula",
        basePace:     80,
        baseStats:    { hp: 1000, torque: 400, cv: 1014 },
        lapLabel:     "Vuelta",
        totalLaps:    30,
        desc:         "La cúspide del automovilismo. La liga más competitiva."
    }
};

// ── Rivals per vehicle type ───────────────────────────────────────
// Car rivals — MEDIUM difficulty
// Player base: 92s. Motor Lv1→90s, Lv2→88s, Lv3→86s + Turbo
// Fresh player lands P4-P6. After Motor Lv2 fights for podium. Pole needs Lv3+.
// basePace = lap time in seconds; HIGHER = slower
const VEHICLE_RIVALS = {
    car: [
        { name: "Marquez",  basePace: 89 },
        { name: "Cortés",   basePace: 90 },
        { name: "Roldán",   basePace: 92 },
        { name: "Varela",   basePace: 94 },
        { name: "Sánchez",  basePace: 96 },
        { name: "Delgado",  basePace: 99 },
        { name: "Herrero",  basePace: 101 },
        { name: "Pérez",    basePace: 103 },
        { name: "Molina",   basePace: 107 }
    ],
    moto: [
        { name: "Álvarez",   basePace: 52 }, { name: "Benetti",   basePace: 52 },
        { name: "Cavani",    basePace: 53 }, { name: "Duarte",    basePace: 54 },
        { name: "Estevez",   basePace: 54 }, { name: "Fior",      basePace: 55 },
        { name: "Garci",     basePace: 55 }, { name: "Hernan",    basePace: 56 },
        { name: "Ibarra",    basePace: 56 }, { name: "Juarez",    basePace: 56 },
        { name: "Kovak",     basePace: 57 }, { name: "Lima",      basePace: 57 },
        { name: "Marin",     basePace: 57 }, { name: "Neri",      basePace: 58 },
        { name: "Oliva",     basePace: 58 }, { name: "Piana",     basePace: 58 },
        { name: "Quintero",  basePace: 59 }, { name: "Rossi",     basePace: 59 },
        { name: "Soto",      basePace: 60 }
    ],
    rally: Array.from({ length: 30 }, (_, i) => ({ name: `RivalR${i+1}`, basePace: 92 + (i % 6) })),
    formula: [
        { name: "Aurelli",  basePace: 66 }, { name: "Bianchi",  basePace: 66 },
        { name: "Capri",    basePace: 67 }, { name: "D'Amico",  basePace: 67 },
        { name: "Engel",    basePace: 68 }, { name: "Falk",     basePace: 68 },
        { name: "Gallo",    basePace: 69 }, { name: "Hato",     basePace: 69 },
        { name: "Ives",     basePace: 69 }, { name: "Juno",     basePace: 70 },
        { name: "Kraus",    basePace: 70 }, { name: "Lefevre",  basePace: 70 },
        { name: "Marek",    basePace: 71 }, { name: "Nero",     basePace: 71 },
        { name: "Ortega",   basePace: 71 }, { name: "Pons",     basePace: 72 },
        { name: "Quinn",    basePace: 72 }, { name: "Riga",     basePace: 72 },
        { name: "Sarto",    basePace: 73 }
    ]
};

// ── Computed stats (base + upgrade bonuses) ───────────────────────
function getVehicleStats(vehicleId) {
    const def  = VEHICLE_CATALOG[vehicleId];
    const veh  = game.vehicles[vehicleId];
    if (!def || !veh) return null;

    const up = veh.upgrades;
    const motorLvl      = up.motor      || 0;
    const turboLvl      = up.turbo      || 0;
    const brakesLvl     = up.brakes     || 0;
    const tiresLvl      = up.tires      || 0;
    const suspensionLvl = up.suspension || 0;

    // car: base 250hp → max 400hp (full upgrades motor5+turbo5)
    // formula: 1 + 4*0.10 + 5*0.04 = 1.60 → 250*1.60 = 400 ✓
    const hpMult  = 1 + (motorLvl - 1) * 0.10 + turboLvl * 0.04;
    const tqMult  = 1 + (motorLvl - 1) * 0.08 + turboLvl * 0.03 + suspensionLvl * 0.02;
    const cvMult  = hpMult;

    return {
        hp:     Math.round(def.baseStats.hp     * hpMult),
        torque: Math.round(def.baseStats.torque * tqMult),
        cv:     Math.round(def.baseStats.cv     * cvMult),
        motor:      motorLvl,
        turbo:      turboLvl,
        brakes:     brakesLvl,
        tires:      tiresLvl,
        suspension: suspensionLvl
    };
}

// ── Race pace calculation ─────────────────────────────────────────
function getVehiclePace(vehicleId) {
    const def  = VEHICLE_CATALOG[vehicleId];
    const veh  = game.vehicles[vehicleId];
    if (!def || !veh) return 999;

    const up       = veh.upgrades;
    const base     = def.basePace;

    const motorBonus      = ((up.motor      || 1) - 1) * 2.0;
    const turboBonus      = (up.turbo       || 0) * 1.5;
    const brakesBonus     = ((up.brakes     || 1) - 1) * 0.8;
    const tiresBonus      = ((up.tires      || 1) - 1) * 1.2;
    const suspensionBonus = ((up.suspension || 1) - 1) * 0.6;

    const repBonus     = Math.min(game.reputation * 0.05, 5);
    const sponsorBonus = game.sponsor ? 1 : 0;
    const mechBonus    = Math.min(getTotalMechanicSpeed() * 0.3, 3);

    const total = motorBonus + turboBonus + brakesBonus + tiresBonus + suspensionBonus + repBonus + sponsorBonus + mechBonus;
    return Math.max(def.basePace * 0.4, base - total);
}

// ── Unlock logic ─────────────────────────────────────────────────
function unlockVehicle(vehicleId) {
    if (!game.vehicles[vehicleId]) return;
    game.vehicles[vehicleId].owned = true;
    notifySuccess(`¡${VEHICLE_CATALOG[vehicleId].icon} ${VEHICLE_CATALOG[vehicleId].name} desbloqueado!`);
    if (window.LeagueManager) LeagueManager.init(vehicleId);
    if (window.FTUEManager && FTUEManager.onVehicleUnlocked) FTUEManager.onVehicleUnlocked(vehicleId);
}

function checkVehicleUnlocks() {
    for (const [id, def] of Object.entries(VEHICLE_CATALOG)) {
        if (!game.vehicles[id].owned && game.level >= def.unlockLevel) {
            unlockVehicle(id);
        }
    }
}

function formatLapTime(secs) {
    const m   = Math.floor(secs / 60);
    const rem = secs % 60;
    const s   = rem < 10 ? "0" + rem.toFixed(3) : rem.toFixed(3);
    return `${m}:${s}`;
}
