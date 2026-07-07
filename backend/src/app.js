const express    = require('express');
const cors       = require('cors');
const routes     = require('./routes/index');
const notFound   = require('./middlewares/notFound.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// --- CORS ---
// El origen permitido se obtiene desde FRONTEND_URL.
// Si no está definida durante el desarrollo se permite localhost:5173.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin:      allowedOrigin,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// --- Body parser ---
app.use(express.json());

// --- Rutas de la API ---
// Todos los endpoints quedan bajo /api
app.use('/api', routes);

// --- Middleware de ruta no encontrada ---
app.use(notFound);

// --- Middleware centralizado de errores ---
app.use(errorHandler);

module.exports = app;
