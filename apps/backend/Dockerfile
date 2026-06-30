FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/backend/package.json ./apps/backend/
RUN npm ci
COPY packages/shared/ ./packages/shared/
COPY apps/backend/ ./apps/backend/
RUN npx prisma generate --schema=./apps/backend/src/prisma/schema.prisma && npm run build:shared && npm run build -w apps/backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY apps/backend/package.json ./
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1
USER node
CMD ["node", "dist/main"]
