FROM ubuntu:latest
RUN apt update
RUN apt install ffmpeg

FROM node:18-bullseye
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm ci --omit=dev
COPY . .
CMD [ "npm", "start" ]