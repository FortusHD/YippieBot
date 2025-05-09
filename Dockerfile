FROM node:22-alpine

WORKDIR /app

ENV npm_config_ignore_scripts=true
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

CMD [ "npm", "start" ]

ENV TZ="Europe/Berlin"