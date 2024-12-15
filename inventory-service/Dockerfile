# Usa una imagen base de Node.js
FROM node:16

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos necesarios para instalar dependencias
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todos los archivos restantes al contenedor
COPY . .

# Expón el puerto en el que la aplicación escucha
EXPOSE 5000

# Comando para iniciar el servidor
CMD ["node", "server.js"]