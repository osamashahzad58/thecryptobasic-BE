FROM node:20-alpine
WORKDIR /backend
COPY package*.json .
RUN npm install
COPY . .
COPY google-services.json .
EXPOSE 8081
CMD [ "npm", "start" ]