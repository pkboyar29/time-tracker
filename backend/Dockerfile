FROM node:22-alpine
WORKDIR /usr/src/app
COPY ./package.json ./
COPY ./package-lock.json ./
COPY ./tsconfig.json ./
RUN npm install
COPY ./src ./src
COPY ./index.ts ./
COPY ./app.ts ./
COPY ./logger.ts ./
# нам не нужен .env файл в контейнере?
# COPY ./.env ./ 

CMD ["npm", "start"]