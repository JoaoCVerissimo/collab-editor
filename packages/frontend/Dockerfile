FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/frontend/package.json packages/frontend/
RUN npm ci --workspace=packages/shared --workspace=packages/frontend --include-workspace-root
COPY tsconfig.base.json .
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/frontend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/frontend/.next ./.next
COPY --from=builder /app/packages/frontend/public ./public
COPY --from=builder /app/packages/frontend/package.json .
COPY --from=builder /app/packages/frontend/next.config.js .
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npx", "next", "start"]
