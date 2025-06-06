FROM node:latest

WORKDIR /app

COPY . .

RUN npm i

EXPOSE 3000
EXPOSE 9229

CMD ["npm", "run", "dev"]