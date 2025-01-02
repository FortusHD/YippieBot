FROM --platform=linux/arm64/v8 node:18-bullseye
ENV TZ="Europe/Berlin"
RUN apt-get update -qq && apt-get install ffmpeg -y
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npm ci --omit=dev
COPY . .
CMD [ "npm", "start" ]