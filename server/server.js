const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');

// Cargar .env desde la raiz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;
const mongoDbName = process.env.MONGODB_DB_NAME || 'garage_motorsports';

if (!mongoUri) {
  console.error('Falta MONGODB_URI en .env');
  process.exit(1);
}

mongoose.connect(mongoUri, { dbName: mongoDbName })
  .then(() => console.log(`Conectado a MongoDB en la base ${mongoDbName}`))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });

const playerSchema = new mongoose.Schema({
  device_id: { type: String, required: true, unique: true },
  player_name: { type: String, default: 'Jugador' },
  garage_name: { type: String, default: 'Mi Garage' },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  total_wins: { type: Number, default: 0 },
  total_poles: { type: Number, default: 0 },
  total_repairs: { type: Number, default: 0 },
  session_time: { type: Number, default: 0 },
  wins_car: { type: Number, default: 0 },
  wins_moto: { type: Number, default: 0 },
  wins_rally: { type: Number, default: 0 },
  wins_formula: { type: Number, default: 0 },
  last_saved: { type: Date, default: Date.now },
  game: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

const Player = mongoose.model('Player', playerSchema);
const Leaderboard = mongoose.model('Leaderboard', new mongoose.Schema({}, { strict: false, collection: 'leaderboard' }));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/status', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = {
    0: 'desconectado',
    1: 'conectado',
    2: 'conectando',
    3: 'desconectando'
  };

  res.json({
    message: 'Hola desde el backend',
    db: states[readyState] || 'estado desconocido'
  });
});

app.post('/api/save', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.device_id) {
      return res.status(400).json({ ok: false, error: 'Falta device_id' });
    }

    const update = {
      player_name: payload.player_name || 'Jugador',
      garage_name: payload.garage_name || 'Mi Garage',
      level: Number(payload.level || 1),
      xp: Number(payload.xp || 0),
      total_wins: Number(payload.total_wins || 0),
      total_poles: Number(payload.total_poles || 0),
      total_repairs: Number(payload.total_repairs || 0),
      session_time: Number(payload.session_time || 0),
      wins_car: Number(payload.wins_car || 0),
      wins_moto: Number(payload.wins_moto || 0),
      wins_rally: Number(payload.wins_rally || 0),
      wins_formula: Number(payload.wins_formula || 0),
      last_saved: new Date(),
      game: payload.game || {}
    };

    await Player.findOneAndUpdate(
      { device_id: payload.device_id },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Leaderboard.findOneAndUpdate(
      { device_id: payload.device_id },
      {
        $set: {
          device_id: payload.device_id,
          player_name: payload.player_name || 'Jugador',
          garage_name: payload.garage_name || 'Mi Garage',
          level: Number(payload.level || 1),
          xp: Number(payload.xp || 0),
          total_wins: Number(payload.total_wins || 0),
          total_poles: Number(payload.total_poles || 0),
          total_repairs: Number(payload.total_repairs || 0),
          session_time: Number(payload.session_time || 0),
          wins_car: Number(payload.wins_car || 0),
          wins_moto: Number(payload.wins_moto || 0),
          wins_rally: Number(payload.wins_rally || 0),
          wins_formula: Number(payload.wins_formula || 0),
          total_coins: Number((payload.game && payload.game.money) || 0),
          updated_at: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Error en /api/save:', err);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

app.get('/api/load', async (req, res) => {
  try {
    const deviceId = req.query.device_id;
    if (!deviceId) {
      return res.status(400).json({ ok: false, error: 'Falta device_id' });
    }

    const player = await Player.findOne({ device_id }).lean();
    if (!player) {
      return res.json({ ok: true, data: null });
    }

    res.json({ ok: true, data: player.game || null });
  } catch (err) {
    console.error('Error en /api/load:', err);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const players = await Leaderboard.find()
      .sort({ level: -1, xp: -1, total_wins: -1, updated_at: -1 })
      .lean();

    const rows = players.map((player, index) => ({
      rank: index + 1,
      device_id: player.device_id,
      player_name: player.player_name || 'Anónimo',
      garage_name: player.garage_name || '—',
      level: player.level || 1,
      xp: player.xp || 0,
      total_wins: player.total_wins || 0,
      total_poles: player.total_poles || 0,
      total_repairs: player.total_repairs || 0,
      session_time: player.session_time || 0,
      wins_car: player.wins_car || 0,
      wins_moto: player.wins_moto || 0,
      wins_rally: player.wins_rally || 0,
      wins_formula: player.wins_formula || 0,
      last_saved: player.updated_at || player.last_saved
    }));

    res.json({ ok: true, rows });
  } catch (err) {
    console.error('Error en /api/leaderboard:', err);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Instagram OAuth endpoints
const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const INSTAGRAM_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI || `http://localhost:${PORT}/auth/instagram/callback`;

app.get('/auth/instagram', (req, res) => {
  const deviceId = req.query.device_id || '';
  if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
    return res.status(500).send('Instagram OAuth no configurado en el servidor');
  }
  const state = encodeURIComponent(deviceId);
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(INSTAGRAM_REDIRECT_URI)}&scope=user_profile&response_type=code&state=${state}`;
  res.redirect(authUrl);
});

app.get('/auth/instagram/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code) return res.status(400).send('Missing code');
  try {
    const body = new URLSearchParams({
      client_id: INSTAGRAM_CLIENT_ID,
      client_secret: INSTAGRAM_CLIENT_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code
    }).toString();

    const tokenResp = await axios.post('https://api.instagram.com/oauth/access_token', body, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    const access_token = tokenResp.data.access_token;
    const user_id = tokenResp.data.user_id;

    const profileResp = await axios.get(`https://graph.instagram.com/${user_id}?fields=id,username&access_token=${access_token}`);
    const username = profileResp.data.username;

    const deviceId = state || '';
    if (deviceId) {
      const player = await Player.findOne({ device_id: deviceId });
      const gameObj = (player && player.game) || {};
      gameObj.instagram = { id: user_id, username, authedAt: new Date() };
      gameObj.diamonds = (gameObj.diamonds || 0) + 50;
      gameObj.lastTime = Date.now();
      await Player.findOneAndUpdate(
        { device_id: deviceId },
        { $set: { game: gameObj, player_name: player ? player.player_name : 'Jugador' } },
        { upsert: true }
      );
    }

    return res.redirect(`/?ig_auth=success&ig_username=${encodeURIComponent(username)}`);
  } catch (err) {
    console.error('Instagram callback error', err?.response?.data || err.message);
    return res.redirect('/?ig_auth=error');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
