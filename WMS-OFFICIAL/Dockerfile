FROM node:16.14.2-alpine

WORKDIR /WMS-OFFICIAL

COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]