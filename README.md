# Sistema de Gestión Hotelera

**Autor:** David Guillén  
**Versión:** 1.0.0  

---

## Descripción

Este proyecto es un **Sistema de Gestión Hotelera** que utiliza una arquitectura de **microservicios**. Está diseñado para gestionar habitaciones, reservas y disponibilidad en un hotel. El sistema está compuesto por los siguientes servicios:

1. **Microservicio de Gestión de Inventario**  
   - Gestiona habitaciones disponibles, su tipo y estado (disponible, mantenimiento, etc.).  

2. **Microservicio de Gestión de Reservas (API REST)**  
   - Permite crear, consultar y cancelar reservas de habitaciones.

3. **Microservicio SOAP**  
   - Verifica la disponibilidad de habitaciones a través de un servicio SOAP.

El sistema incluye documentación interactiva para cada servicio mediante **Swagger**.

---

## Requisitos Previos

Antes de comenzar, asegúrate de contar con las siguientes herramientas instaladas:

- [Node.js](https://nodejs.org/) (v16 o superior)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/)

---

## Estructura del Proyecto

```plaintext
hotel-system/
├── api-rest-reservations/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
├── inventory-service/
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
├── soap-service/
│   ├── Dockerfile
│   ├── index.js
│   ├── package.json
├── docker-compose.yml
├── sql-scripts/
│   ├── inventory_service.sql
│   ├── rest_api_service.sql
│   ├── soap_service.sql
├── Arquitectura.png
├── Clases.png
├── Despliegue.png
├── Flujo.png
├── Secuencia.png
└── README.md

---

## Instalación y Ejecución

### **1. Ejecución con Docker Compose**

1. **Clona este repositorio:**

   ```bash
   git clone https://github.com/davidguillen2002/hotel-system.git
   cd hotel-system
   ```

2. **Levanta los servicios con Docker Compose:**

   ```bash
   docker-compose up --build
   ```

3. **Verifica que los servicios estén funcionando:**

   - **Inventario:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)  
   - **Reservas:** [http://localhost:4000/api-docs](http://localhost:4000/api-docs)  
   - **Servicio SOAP:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)  

---

### **2. Ejecución Local**

1. **Instala las dependencias para cada servicio:**

   ```bash
   cd inventory-service
   npm install
   cd ../api-rest-reservations
   npm install
   cd ../soap-service
   npm install
   ```

2. **Inicializa la base de datos PostgreSQL:**

   - **Crea una base de datos llamada `hotel_system`.**
   - Ejecuta los scripts SQL incluidos en el directorio `sql-scripts`:

     ```bash
     psql -U postgres -f sql-scripts/inventory_service.sql
     psql -U postgres -f sql-scripts/rest_api_service.sql
     psql -U postgres -f sql-scripts/soap_service.sql
     ```

3. **Ejecuta cada servicio de forma individual:**

   - Inventario:
     ```bash
     cd inventory-service
     npm start
     ```
   - Reservas:
     ```bash
     cd api-rest-reservations
     npm start
     ```
   - SOAP:
     ```bash
     cd soap-service
     npm start
     ```

4. **Verifica que los servicios estén funcionando:**  

---

## Inicialización de la Base de Datos

### **1. Esquema del Inventario**

```sql
CREATE DATABASE inventory_service;

\c inventory_service;

CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    room_number INTEGER NOT NULL UNIQUE,
    room_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available'
);

INSERT INTO rooms (room_number, room_type, status) VALUES
(101, 'single', 'available'),
(102, 'double', 'maintenance'),
(103, 'suite', 'available');
```

### **2. Esquema de Reservas**

```sql
CREATE DATABASE rest_api_service;

\c rest_api_service;

CREATE TABLE reservations (
    reservation_id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
```

### **3. Esquema de Disponibilidad (SOAP)**

```sql
CREATE DATABASE soap_service;

\c soap_service;

CREATE TABLE availability (
    availability_id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    available_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    FOREIGN KEY (room_id) REFERENCES rooms(room_id)
);
```

---

## Diagramas

### Arquitectura del Sistema
![Arquitectura](https://github.com/davidguillen2002/hotel-system/blob/main/Arquitectura.png)

### Diagrama de Clases
![Clases](https://github.com/davidguillen2002/hotel-system/blob/main/Clases.png)

### Diagrama de Despliegue
![Despliegue](https://github.com/davidguillen2002/hotel-system/blob/main/Despliegue.png)

### Flujo de Actividades
![Flujo](https://github.com/davidguillen2002/hotel-system/blob/main/Flujo.png)

### Diagrama de Secuencia
![Secuencia](https://github.com/davidguillen2002/hotel-system/blob/main/Secuencia.png)

---

## Video Demostrativo

**Puedes ver la demostración completa del sistema en el siguiente enlace:**  
[https://youtu.be/l_kqqEeWAI0](https://youtu.be/l_kqqEeWAI0)

---

## URLs Principales

- **Microservicio de Gestión de Inventario:**  
  [http://localhost:5000/api-docs](http://localhost:5000/api-docs)  

- **Microservicio de Gestión de Reservas:**  
  [http://localhost:4000/api-docs](http://localhost:4000/api-docs)  

- **Microservicio SOAP:**  
  [http://localhost:3000/api-docs](http://localhost:3000/api-docs)  

---

**Autor:** David Guillén  
