FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/collaboration/package.json packages/collaboration/
RUN npm ci --workspace=packages/shared --workspace=packages/collaboration --include-workspace-root
COPY tsconfig.base.json .
COPY packages/shared packages/shared
COPY packages/collaboration packages/collaboration
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/collaboration

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/collaboration/dist ./dist
COPY --from=builder /app/packages/collaboration/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@collab-editor/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@collab-editor/shared/
COPY .env .env
EXPOSE 1234
CMD ["node", "dist/index.js"]
