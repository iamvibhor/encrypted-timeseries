FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080
EXPOSE 3000

CMD ["node", "listener.js"]