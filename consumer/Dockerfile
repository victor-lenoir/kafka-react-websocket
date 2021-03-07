FROM node:current-buster
WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . /app/
EXPOSE 3000
CMD node consumer.js
