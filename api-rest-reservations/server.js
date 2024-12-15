require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const soap = require('soap');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();

// Middleware para parsear JSON y solicitudes con cuerpo en formato texto/xml
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'text/xml' }));

// Configuración de la conexión a la base de datos
const pool = new Pool({
    user: process.env.DB_USER || 'postgres', // Usuario de PostgreSQL
    host: process.env.DB_HOST || 'db',
    database: process.env.DB_NAME || 'rest_api_service', // Nombre de la base de datos
    password: process.env.DB_PASSWORD || 'Monono123', // Cambia con tu contraseña
    port: process.env.DB_PORT || 5432, // Puerto ajustado según docker-compose
});

// Configuración de Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API REST de Gestión de Reservas',
            version: '1.0.0',
            description: 'Documentación de la API REST para gestionar reservas de habitaciones.',
        },
        servers: [
            { url: 'http://localhost:4000' },
        ],
    },
    apis: ['./server.js'], // Ruta de este archivo para leer las anotaciones Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Crea una nueva reserva.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               room_type:
 *                 type: string
 *               customer_name:
 *                 type: string
 *             required:
 *               - start_date
 *               - end_date
 *               - room_type
 *               - customer_name
 *     responses:
 *       201:
 *         description: Reserva creada exitosamente.
 *       400:
 *         description: Error en la solicitud.
 */

// Función para verificar disponibilidad utilizando el servicio SOAP
const checkAvailability = async (start_date, end_date, room_type) => {
    try {
        const url = 'http://soap-service:3000/soap?wsdl'; // URL utilizando el nombre del servicio Docker
        const client = await soap.createClientAsync(url);
        const args = { startDate: start_date, endDate: end_date, roomType: room_type };

        // Llamada al servicio SOAP para verificar la disponibilidad
        const [response] = await client.CheckAvailabilityAsync(args);

        console.log('Respuesta SOAP:', response);

        if (!response || !response.rooms || !response.rooms.room) {
            throw new Error('No se pudo obtener información de disponibilidad.');
        }

        return Array.isArray(response.rooms.room) ? response.rooms.room : [response.rooms.room];
    } catch (error) {
        console.error('SOAP Error:', error);
        throw new Error('Error al consultar disponibilidad.');
    }
};

// Endpoint para realizar reservas
app.post('/reservations', async (req, res) => {
    const { start_date, end_date, room_type, customer_name } = req.body;

    console.log('Datos recibidos:', req.body);

    if (!start_date || !end_date || !room_type || !customer_name) {
        return res.status(400).json({ error: 'Faltan parámetros necesarios.' });
    }

    try {
        const availableRooms = await checkAvailability(start_date, end_date, room_type);

        if (!availableRooms || availableRooms.length === 0) {
            return res.status(400).json({ error: 'No hay habitaciones disponibles.' });
        }

        const room = availableRooms[0]; // Selecciona la primera habitación disponible

        const query = `
            INSERT INTO reservations (room_id, customer_name, start_date, end_date, status) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`;
        const values = [room.room_id, customer_name, start_date, end_date, 'confirmed'];
        const result = await pool.query(query, values);

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error en POST /reservations:', error);
        return res.status(500).json({ error: 'Error al realizar la reserva.' });
    }
});

/**
 * @swagger
 * /reservations/{id}:
 *   get:
 *     summary: Obtiene una reserva específica por ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Información de la reserva encontrada.
 *       404:
 *         description: Reserva no encontrada.
 */

// Endpoint para consultar una reserva específica
app.get('/reservations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('SELECT * FROM reservations WHERE reservation_id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error en GET /reservations/:id:', error);
        return res.status(500).json({ error: 'Error al obtener la reserva.' });
    }
});

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Elimina una reserva específica por ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reserva eliminada exitosamente.
 *       404:
 *         description: Reserva no encontrada.
 */

// Endpoint para cancelar una reserva
app.delete('/reservations/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM reservations WHERE reservation_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Reserva no encontrada.' });
        }

        return res.status(200).json({ message: 'Reserva eliminada exitosamente.' });
    } catch (error) {
        console.error('Error en DELETE /reservations/:id:', error);
        return res.status(500).json({ error: 'Error al eliminar la reserva.' });
    }
});

// Iniciar el servidor
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`API REST de Gestión de Reservas corriendo en http://localhost:${port}`);
    console.log(`Documentación Swagger disponible en http://localhost:${port}/api-docs`);
});