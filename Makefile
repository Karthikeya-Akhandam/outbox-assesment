.PHONY: help run clear docker-up docker-down

help:
	@echo "Available commands:"
	@echo "  make run    - Starts Docker services, runs Prisma migrations, and starts the backend and frontend"
	@echo "  make clear  - Stops Docker services and removes all volumes/data"

docker-up:
	docker-compose -f docker/docker-compose.yml up -d

docker-down:
	docker-compose -f docker/docker-compose.yml down -v

run: docker-up
	@echo "Waiting for database to be ready..."
	@sleep 5
	@echo "Running Prisma migrations..."
	cd backend && npx prisma db push
	@echo "Starting application..."
	@echo "Start backend and frontend manually or add start scripts here later."

clear: docker-down
	@echo "All containers and volumes cleared."
