import express from 'express';
import { getNetworkTime } from 'ntp-client';
import cors from 'cors';
import { config } from 'dotenv';

config();

const app = express();
const PORT = process.env.PORT || 3000;

let cachedHoraOficial = null;
let cachedHoraOficialTime = null;
const syncInterval = 15 * 60 * 1000; // 15 minutos en milisegundos

// Función para sincronizar la hora oficial
const sincronizarHoraOficial = () => {
    getNetworkTime('ntp.shoa.cl', 123, (err, date) => {
        if (err) {
            console.error('Error al obtener la hora oficial:', err);
            return;
        }
        cachedHoraOficial = date;
        cachedHoraOficialTime = Date.now();
        console.log('Hora oficial sincronizada:', cachedHoraOficial);
        console.log('Hora oficial actualizada a las', new Date().toLocaleTimeString());
    });
};

// Sincronizar la hora oficial al iniciar el servidor
sincronizarHoraOficial();

// Sincronizar la hora oficial cada minuto
setInterval(sincronizarHoraOficial, syncInterval);

// Habilitar CORS
app.use(cors());

// Ruta para obtener la hora oficial
app.get('/hora-oficial', (req, res) => {
    if (!cachedHoraOficial) {
        return res.status(503).json({ error: 'Hora oficial no disponible. Intente nuevamente en un momento.' });
    }
    // Calcular la hora oficial basada en el tiempo transcurrido desde la última sincronización
    const now = Date.now();
    const elapsedTime = now - cachedHoraOficialTime;
    const currentHoraOficial = new Date(cachedHoraOficial.getTime() + elapsedTime);
    res.json({ horaOficial: currentHoraOficial.toString() });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor backend iniciado en puerto ${PORT}`);
});