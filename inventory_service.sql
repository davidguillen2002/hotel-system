-- Crear la base de datos para el servicio de inventario
CREATE DATABASE inventory_service;

\c inventory_service; -- Conectar a la base de datos

-- Crear la tabla rooms para gestionar habitaciones
CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,           -- ID único de la habitación
    room_number INT NOT NULL UNIQUE,      -- Número de habitación
    room_type VARCHAR(50) NOT NULL,       -- Tipo de habitación (ej: single, double)
    status VARCHAR(20) NOT NULL DEFAULT 'available' -- Estado de la habitación
);

-- Insertar datos de prueba iniciales
INSERT INTO rooms (room_number, room_type, status) VALUES
(101, 'single', 'available'),
(102, 'double', 'maintenance'),
(103, 'suite', 'available'),
(104, 'double', 'available');