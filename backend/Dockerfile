# Imagen base de Node.js
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (cache de capas)
COPY package.json package-lock.json ./

# Instalar dependencias de produccion
RUN npm ci --only=production

# Copiar el resto del codigo fuente
COPY . .

# Crear directorio de uploads
RUN mkdir -p /app/uploads

# Puerto que expone el servidor
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
