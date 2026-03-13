.PHONY: install dev build test lint typecheck migrate docker-up docker-down docker-build clean

# Install all dependencies
install:
	npm install

# Run all services in development mode (requires PostgreSQL running)
dev:
	@echo "Starting development servers..."
	@echo "Make sure PostgreSQL is running on localhost:5432"
	@echo "Run 'make migrate' first if you haven't already"
	npx concurrently \
		"npm run dev --workspace=packages/collaboration" \
		"npm run dev --workspace=packages/backend" \
		"npm run dev --workspace=packages/frontend"

# Build all packages
build:
	npm run build --workspace=packages/shared
	npm run build --workspace=packages/backend
	npm run build --workspace=packages/collaboration
	npm run build --workspace=packages/frontend

# Run tests
test:
	npm run test --workspaces --if-present

# Lint all packages
lint:
	npm run lint --workspaces --if-present

# Type check all packages
typecheck:
	npm run typecheck --workspaces --if-present

# Run database migrations
migrate:
	npm run migrate --workspace=packages/database

# Rollback database migrations
migrate-rollback:
	npm run migrate:rollback --workspace=packages/database

# Docker Compose: build and start all services
docker-up:
	docker compose up --build -d
	@echo "Waiting for services to start..."
	@sleep 5
	@echo "Running migrations..."
	npm run migrate --workspace=packages/database
	@echo ""
	@echo "Services running:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  Backend API:   http://localhost:4000"
	@echo "  Collab Server: ws://localhost:1234"
	@echo "  PostgreSQL:    localhost:5432"

# Docker Compose: stop all services
docker-down:
	docker compose down

# Docker Compose: stop and remove volumes
docker-clean:
	docker compose down -v

# Clean build artifacts
clean:
	rm -rf packages/shared/dist
	rm -rf packages/backend/dist
	rm -rf packages/collaboration/dist
	rm -rf packages/frontend/.next
	rm -rf node_modules
	rm -rf packages/*/node_modules
