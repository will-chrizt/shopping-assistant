# Catalog Service Makefile

.PHONY: help install run dev test build docker-build docker-run clean lint format seed

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install dependencies"
	@echo "  run         - Run the production server"
	@echo "  dev         - Run the development server with auto-reload"
	@echo "  test        - Run tests"
	@echo "  build       - Build the application"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run  - Run Docker container"
	@echo "  lint        - Run linting"
	@echo "  format      - Format code"
	@echo "  seed        - Seed database with sample data"
	@echo "  clear-db    - Clear database"
	@echo "  clean       - Clean up"

# Install dependencies
install:
	npm install

# Run production server
run:
	npm start

# Run development server
dev:
	npm run dev

# Run tests
test:
	npm test

# Run tests with coverage
test-coverage:
	npm run test:coverage

# Build application (linting and formatting)
build: lint format
	@echo "Building Catalog Service..."
	@echo "Build completed successfully"

# Build Docker image
docker-build:
	docker build -t shopping-assistant/catalog-service:latest .

# Run Docker container
docker-run:
	docker run -p 3000:3000 \
		--env-file .env \
		shopping-assistant/catalog-service:latest

# Run with docker-compose
docker-compose-up:
	docker-compose up --build catalog-service

# Lint code
lint:
	npm run lint

# Fix linting issues
lint-fix:
	npm run lint:fix

# Format code
format:
	npm run format

# Seed database
seed:
	npm run seed

# Clear database
clear-db:
	npm run clear-db

# Clean up
clean:
	rm -rf node_modules
	rm -rf coverage
	rm -rf dist
	npm cache clean --force

# Development shortcuts
setup: install
	@echo "Setting up development environment..."
	cp .env.example .env
	@echo "Please update .env with your configuration"

dev-full: install seed dev

# Production shortcuts
prod-build: docker-build
prod-run: docker-run

# Database management
db-seed: seed
db-clear: clear-db

# Health check
health:
	@curl -f http://localhost:3000/health || echo "Service not running"

# Show logs (when using Docker)
logs:
	docker logs -f catalog-service

# Start MongoDB locally (if using Docker)
start-mongo:
	docker run -d \
		--name mongodb-local \
		-p 27017:27017 \
		-e MONGO_INITDB_ROOT_USERNAME=shopping_user \
		-e MONGO_INITDB_ROOT_PASSWORD=shopping_pass \
		-
