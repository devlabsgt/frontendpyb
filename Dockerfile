# Usar node 18 como base
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de archivos del proyecto
COPY . .

# Establecer variable de entorno CI a false para evitar que los warnings detengan el build
ENV CI=false

# Construir la aplicación
RUN npm run build

# Instalar serve globalmente
RUN npm install -g serve

# Exponer el puerto 3000
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["serve", "-s", "build"]