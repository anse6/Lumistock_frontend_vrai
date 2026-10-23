# Étape de développement avec hot reload (Vite)
FROM node:20 AS dev

# Définir le dossier de travail
WORKDIR /app

# Copier tous les fichiers dans l'image
COPY . .

# Installer les dépendances
RUN npm install

# Exposer le port utilisé par Vite
EXPOSE 5173

# Commande de démarrage
CMD ["npm", "run", "dev", "--", "--host"]

