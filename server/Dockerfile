FROM node:latest

WORKDIR /home/node/app
COPY package.json .
RUN npm install --quiet
RUN mkdir -p node_modules/.cache && chmod -R 777 node_modules/.cache