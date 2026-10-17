FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG BACKEND_URL=http://backend:8000
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_MEMORY_UNIVERSE_URL=http://localhost:5173

ENV BACKEND_URL=$BACKEND_URL \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_MEMORY_UNIVERSE_URL=$NEXT_PUBLIC_MEMORY_UNIVERSE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p public && npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

USER node

EXPOSE 3000

CMD ["node", "server.js"]
