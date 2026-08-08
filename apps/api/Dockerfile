FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app ./
EXPOSE 3001
CMD ["node","dist/main.js"]
