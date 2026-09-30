.PHONY: help run clean clear docker-up docker-down backend frontend

help:
	@echo "Available commands:"
	@echo "  make run      - Starts Docker services and runs Prisma migrations"
	@echo "  make backend  - Starts the backend server"
	@echo "  make frontend - Starts the frontend server"
	@echo "  make clean    - Stops Docker services and removes all volumes/data"

docker-up:
	docker-compose -f docker/docker-compose.yml up -d

docker-down:
	docker-compose -f docker/docker-compose.yml down -v

run: docker-up
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Running Prisma migrations..."
	cd backend && npm install && npx prisma db push
	@echo "Infrastructure ready! You can now run 'make backend' and 'make frontend' in separate terminals."

backend: docker-up
	@echo "Starting backend..."
	cd backend && npm install && npx prisma db push && npm run dev

frontend:
	@echo "Starting frontend..."
	cd frontend && npm install && npm run dev

clean: docker-down
	@echo "All containers and volumes cleared."

clear: clean
