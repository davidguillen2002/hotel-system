-- Crear la base de datos para el servicio de reservas
CREATE DATABASE rest_api_service;

\c rest_api_service; -- Conectar a la base de datos

-- Crear la tabla reservations para gestionar reservas
CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,    -- ID único de la reserva
    room_id INT NOT NULL,                 -- ID de la habitación reservada (FK)
    customer_name VARCHAR(100) NOT NULL,  -- Nombre del cliente
    start_date DATE NOT NULL,             -- Fecha de inicio de la reserva
    end_date DATE NOT NULL,               -- Fecha de finalización de la reserva
    FOREIGN KEY (room_id) REFERENCES rooms (room_id)
);

-- Insertar datos de prueba iniciales
INSERT INTO reservations (room_id, customer_name, start_date, end_date) VALUES
(101, 'Juan Pérez', '2024-12-20', '2024-12-25'),
(103, 'Ana Gómez', '2024-12-22', '2024-12-23');