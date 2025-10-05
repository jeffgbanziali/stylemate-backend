# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copier package.json et package-lock.json / installer les dépendances
COPY package*.json ./
RUN npm install

# Copier le reste du projet
COPY . .

# Lancer le serveur en mode dev
CMD ["npm", "run", "dev"]
