-- Crear la base de datos para el servicio SOAP
CREATE DATABASE soap_service;

\c soap_service; -- Conectar a la base de datos

-- Crear la tabla availability para gestionar disponibilidad
CREATE TABLE availability (
    availability_id SERIAL PRIMARY KEY,   -- ID único de la disponibilidad
    room_id INT NOT NULL,                 -- ID de la habitación (FK)
    available_date DATE NOT NULL,         -- Fecha específica de disponibilidad
    status VARCHAR(20) NOT NULL DEFAULT 'available', -- Estado de la disponibilidad
    FOREIGN KEY (room_id) REFERENCES rooms (room_id)
);

-- Insertar datos de prueba iniciales
INSERT INTO availability (room_id, available_date, status) VALUES
(101, '2024-12-20', 'available'),
(102, '2024-12-21', 'maintenance'),
(103, '2024-12-22', 'available'),
(104, '2024-12-23', 'available');