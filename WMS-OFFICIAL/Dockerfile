FROM node:16.14.2-alpine

WORKDIR /WMS-OFFICIAL

COPY package*.json /WMS-OFFICIAL
COPY . /WMS-OFFICIAL

RUN npm install
RUN npm build

EXPOSE 3000
CMD ["node", "server.js"]