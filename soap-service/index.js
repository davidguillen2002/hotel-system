require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db'); // Conexión a la base de datos
const soap = require('soap');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

const app = express();
app.use(bodyParser.raw({ type: 'text/xml' }));

// Archivo WSDL como string
const wsdl = `
<wsdl:definitions xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns:tns="http://www.example.org/HotelAvailability/"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    targetNamespace="http://www.example.org/HotelAvailability/">

    <wsdl:types>
        <xsd:schema targetNamespace="http://www.example.org/HotelAvailability/">
            <xsd:element name="CheckAvailabilityRequest">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="startDate" type="xsd:string" />
                        <xsd:element name="endDate" type="xsd:string" />
                        <xsd:element name="roomType" type="xsd:string" />
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
            <xsd:element name="CheckAvailabilityResponse">
                <xsd:complexType>
                    <xsd:sequence>
                        <xsd:element name="rooms" type="xsd:string" />
                    </xsd:sequence>
                </xsd:complexType>
            </xsd:element>
        </xsd:schema>
    </wsdl:types>

    <wsdl:message name="CheckAvailabilityRequest">
        <wsdl:part name="parameters" element="tns:CheckAvailabilityRequest" />
    </wsdl:message>

    <wsdl:message name="CheckAvailabilityResponse">
        <wsdl:part name="parameters" element="tns:CheckAvailabilityResponse" />
    </wsdl:message>

    <wsdl:portType name="HotelAvailabilityPortType">
        <wsdl:operation name="CheckAvailability">
            <wsdl:input message="tns:CheckAvailabilityRequest" />
            <wsdl:output message="tns:CheckAvailabilityResponse" />
        </wsdl:operation>
    </wsdl:portType>

    <wsdl:binding name="HotelAvailabilityBinding" type="tns:HotelAvailabilityPortType">
        <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http" />
        <wsdl:operation name="CheckAvailability">
            <soap:operation soapAction="CheckAvailability" />
            <wsdl:input>
                <soap:body use="literal" />
            </wsdl:input>
            <wsdl:output>
                <soap:body use="literal" />
            </wsdl:output>
        </wsdl:operation>
    </wsdl:binding>

    <wsdl:service name="HotelAvailabilityService">
        <wsdl:port name="HotelAvailabilityPort" binding="tns:HotelAvailabilityBinding">
            <soap:address location="http://soap-service:3000/soap" />
        </wsdl:port>
    </wsdl:service>
</wsdl:definitions>
`;

// Implementación del servicio SOAP
const service = {
    HotelAvailabilityService: {
        HotelAvailabilityPort: {
            CheckAvailability: async (args) => {
                try {
                    const { startDate, endDate, roomType } = args;

                    if (!startDate || !endDate || !roomType) {
                        throw new Error("Missing required parameters: startDate, endDate, or roomType");
                    }

                    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
                        throw new Error("Invalid date format. Use 'YYYY-MM-DD'.");
                    }

                    const query = `
                        SELECT room_id, available_date 
                        FROM availability 
                        WHERE room_type = $1 
                        AND available_date BETWEEN $2 AND $3 
                        AND status = 'available'
                    `;
                    const result = await pool.query(query, [roomType, startDate, endDate]);

                    if (result.rows.length === 0) {
                        return { rooms: { $xml: "<rooms></rooms>" } };
                    }

                    const roomsXML = result.rows.map(row => `
                        <room>
                            <room_id>${row.room_id}</room_id>
                            <available_date>${row.available_date.toISOString().split('T')[0]}</available_date>
                        </room>
                    `).join("");

                    return { rooms: { $xml: roomsXML } };
                } catch (error) {
                    console.error("Error in CheckAvailability:", error.message);
                    throw {
                        Fault: {
                            Code: { Value: "SOAP-ENV:Server" },
                            Reason: { Text: error.message || "Internal Server Error" },
                        },
                    };
                }
            },
        },
    },
};

// Configuración de Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'SOAP Service - Hotel Availability',
            version: '1.0.0',
            description: 'SOAP Service para verificar la disponibilidad de habitaciones en un hotel',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor SOAP',
            },
        ],
    },
    apis: ['./index.js'], // Cambia a 'index.js' ya que este es tu archivo principal
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /wsdl:
 *   get:
 *     summary: Obtener el archivo WSDL del servicio SOAP.
 *     responses:
 *       200:
 *         description: Archivo WSDL en texto plano.
 */

/**
 * @swagger
 * /soap:
 *   post:
 *     summary: Enviar solicitud SOAP al servicio de disponibilidad.
 *     requestBody:
 *       required: true
 *       content:
 *         text/xml:
 *           schema:
 *             type: string
 *     responses:
 *       200:
 *         description: Respuesta exitosa en formato XML.
 *       400:
 *         description: Error en la solicitud SOAP.
 */

app.get('/wsdl', (req, res) => {
    res.set('Content-Type', 'text/xml');
    res.send(wsdl);
});

// Iniciar el servidor SOAP
app.listen(process.env.PORT || 3000, () => {
    soap.listen(app, '/soap', service, wsdl);
    console.log(`SOAP Service running on http://localhost:${process.env.PORT || 3000}/soap`);
    console.log(`Swagger documentation available at http://localhost:${process.env.PORT || 3000}/api-docs`);
});