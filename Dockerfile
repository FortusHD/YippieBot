FROM node:18-bullseye
WORKDIR /app

RUN apt install ffmpeg

COPY package*.json ./
RUN npm install
RUN npm ci --omit=dev
COPY . .
CMD [ "npm", "start" ]