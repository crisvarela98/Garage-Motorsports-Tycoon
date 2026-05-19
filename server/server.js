const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar .env desde la raiz del proyecto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Conexión a MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('Falta MONGODB_URI en .env');
  process.exit(1);
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message);
  });

// Middleware
app.use(express.json());

// Servir archivos estáticos (frontend simple)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Endpoint de prueba para comprobar estado de BD
app.get('/api/status', (req, res) => {
  const readyState = mongoose.connection.readyState; // 0 disconnected,1 connected,2 connecting,3 disconnecting
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

// Ruta por defecto
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
