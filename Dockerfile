FROM node:21-alpine3.18

WORKDIR /app
COPY . /app

RUN npm install
RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "serve"]