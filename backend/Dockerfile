FROM node:20-slim

WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy; node prisma/seed.js; npx ts-node --transpile-only prisma/seed-products.ts; node dist/main"]
