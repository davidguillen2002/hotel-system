require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();

// Middleware para parsear JSON
app.use(bodyParser.json());

// Configuración de la conexión a la base de datos
const pool = new Pool({
    user: 'postgres', // Usuario de PostgreSQL
    host: process.env.DB_HOST || 'localhost',
    database: 'inventory_service', // Base de datos para el microservicio
    password: process.env.DB_PASSWORD || 'Monono123', // Contraseña desde .env o valor por defecto
    port: process.env.DB_PORT || 5432, // Puerto actualizado
});

// Configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microservicio de Gestión de Inventario',
            version: '1.0.0',
            description: 'API para gestionar habitaciones en un hotel',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Servidor local',
            },
        ],
        components: {
            schemas: {
                Room: {
                    type: 'object',
                    properties: {
                        room_id: {
                            type: 'integer',
                            description: 'ID de la habitación (auto-generado).',
                        },
                        room_number: {
                            type: 'integer',
                            description: 'Número de la habitación.',
                        },
                        room_type: {
                            type: 'string',
                            description: 'Tipo de la habitación (ej: single, double).',
                        },
                        status: {
                            type: 'string',
                            description: 'Estado de la habitación (ej: available, maintenance).',
                        },
                    },
                    required: ['room_number', 'room_type'],
                },
            },
        },
    },
    apis: ['./server.js'], // Ruta al archivo donde están las anotaciones de Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Función para manejar errores internos
const handleError = (res, error, message) => {
    console.error(message, error);
    return res.status(500).json({ error: message });
};

/**
 * @swagger
 * /rooms:
 *   post:
 *     summary: "Registrar una nueva habitación."
 *     tags:
 *       - Rooms
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               room_number:
 *                 type: integer
 *                 description: "Número de la habitación."
 *               room_type:
 *                 type: string
 *                 description: "Tipo de la habitación."
 *             required:
 *               - room_number
 *               - room_type
 *     responses:
 *       201:
 *         description: "Habitación creada exitosamente."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: "Parámetros faltantes o inválidos."
 *       500:
 *         description: "Error interno del servidor."
 */
app.post('/rooms', async (req, res) => {
    const { room_number, room_type } = req.body;

    if (!room_number || !room_type) {
        return res.status(400).json({ error: 'Faltan parámetros necesarios: room_number y room_type.' });
    }

    try {
        const query = 'INSERT INTO rooms (room_number, room_type, status) VALUES ($1, $2, $3) RETURNING *';
        const values = [room_number, room_type, 'available'];
        const result = await pool.query(query, values);

        return res.status(201).json(result.rows[0]);
    } catch (error) {
        return handleError(res, error, 'Error al registrar la habitación.');
    }
});

/**
 * @swagger
 * /rooms/{id}:
 *   patch:
 *     summary: "Actualizar el estado de una habitación."
 *     tags:
 *       - Rooms
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: "ID de la habitación a actualizar."
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: "Nuevo estado de la habitación."
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: "Habitación actualizada exitosamente."
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Room'
 *       400:
 *         description: "Parámetros faltantes o inválidos."
 *       404:
 *         description: "Habitación no encontrada."
 *       500:
 *         description: "Error interno del servidor."
 */
app.patch('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'El estado es necesario para actualizar.' });
    }

    try {
        const query = 'UPDATE rooms SET status = $1 WHERE room_id = $2 RETURNING *';
        const values = [status, id];
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Habitación no encontrada.' });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        return handleError(res, error, 'Error al actualizar el estado de la habitación.');
    }
});

/**
 * @swagger
 * /rooms:
 *   get:
 *     summary: "Obtener todas las habitaciones."
 *     tags:
 *       - Rooms
 *     responses:
 *       200:
 *         description: "Lista de habitaciones."
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Room'
 *       500:
 *         description: "Error interno del servidor."
 */
app.get('/rooms', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM rooms ORDER BY room_id ASC');
        return res.status(200).json(result.rows);
    } catch (error) {
        return handleError(res, error, 'Error al obtener las habitaciones.');
    }
});

// Iniciar el servidor
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Microservicio de Gestión de Inventario corriendo en http://localhost:${port}`);
    console.log(`Documentación disponible en http://localhost:${port}/api-docs`);
});