# --------------------------------------------------------------
# Teranga Voyages - Frontend React compilé + Nginx (point d'entrée unique)
#  - /            -> application React (SPA)
#  - /api, /up    -> Laravel (PHP-FPM, conteneur "backend")
#  - /storage     -> fichiers téléversés (volume partagé)
# --------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
