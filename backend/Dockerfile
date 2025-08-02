# проверить работоспособность копирования

# TODO: надо использовать конкретную версию?
FROM node:alpine
WORKDIR /usr/src/app
COPY ./package.json ./
COPY ./package-lock.json ./
RUN npm install
COPY ./src ./src
COPY ./index.ts ./
# нам не нужен .env файл в контейнере?
# COPY ./.env ./ 

CMD ["npm", "start"]