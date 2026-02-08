FROM node:18

WORKDIR /app

COPY backend/package*.json ./backend/

WORKDIR /app/backend

RUN npm install --legacy-peer-deps

COPY backend/ .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
