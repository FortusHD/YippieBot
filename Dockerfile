FROM node:18-bullseye

ENV TZ="Europe/Berlin"
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "npm", "start" ]