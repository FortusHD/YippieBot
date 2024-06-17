FROM node:18-bullseye
RUN apt-get update && apt install -y ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm ci --omit=dev
COPY . .
CMD [ "npm", "start" ]