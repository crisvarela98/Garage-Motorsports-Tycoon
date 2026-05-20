const CLOUD_SAVE_DEVICE_ID_KEY = 'mgt_cloud_device_id';

const CloudSave = {
    base() {
        return '';
    },

    getDeviceId() {
        let id = localStorage.getItem(CLOUD_SAVE_DEVICE_ID_KEY);
        if (!id) {
            id = 'dev_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
            localStorage.setItem(CLOUD_SAVE_DEVICE_ID_KEY, id);
        }
        return id;
    },

    buildPayload(game) {
        const stats = game.stats || {};
        return {
            device_id: CloudSave.getDeviceId(),
            lastTime: Date.now(),
            player_name: game.playerName || 'Jugador',
            garage_name: game.garageName || 'Mi Garage',
            level: Number(game.level || 1),
            xp: Number(game.xp || 0),
            total_wins: Number(stats.totalWins || 0),
            total_poles: Number(stats.totalPoles || 0),
            total_repairs: Number(stats.totalRepairs || 0),
            session_time: Number(game.totalPlayTime || 0),
            wins_car: Number(stats.wins_car || 0),
            wins_moto: Number(stats.wins_moto || 0),
            wins_rally: Number(stats.wins_rally || 0),
            wins_formula: Number(stats.wins_formula || 0),
            game
        };
    },

    async save(game) {
        try {
            await fetch(CloudSave.base() + '/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(CloudSave.buildPayload(game)),
                signal: AbortSignal.timeout(10000)
            });
        } catch (err) {
            console.warn('[CloudSave] save failed:', err?.message || err);
        }
    },

    async load() {
        try {
            const deviceId = CloudSave.getDeviceId();
            const res = await fetch(CloudSave.base() + '/api/load?device_id=' + encodeURIComponent(deviceId), {
                signal: AbortSignal.timeout(10000)
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json.ok ? (json.data || null) : null;
        } catch (err) {
            console.warn('[CloudSave] load failed:', err?.message || err);
            return null;
        }
    }
};

window.CloudSave = CloudSave;
