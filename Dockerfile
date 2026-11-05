# The Yugaantar esports site. Run it with its database and demo data:
#   docker compose up
# then open http://localhost:3000 (login codes arrive at http://localhost:8025).

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["/app/docker/app/start.sh"]
