FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/
RUN npm ci --workspace=packages/shared --workspace=packages/backend --include-workspace-root
COPY tsconfig.base.json .
COPY packages/shared packages/shared
COPY packages/backend packages/backend
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/backend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@collab-editor/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@collab-editor/shared/
COPY .env .env
EXPOSE 4000
CMD ["node", "dist/index.js"]
