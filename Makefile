.PHONY: run setup docker-up docker-down seed dev test

# Inicia TUDO (Docker + Seeds + API)
run: docker-up seed dev

# Setup inicial (instala dependências + inicia Docker + roda seeds)
setup:
	npm install
	docker-compose up -d
	@sleep 3
	npm run seed

# Docker
docker-up:
	docker-compose up -d
	@sleep 2

docker-down:
	docker-compose down

# Seeds
seed:
	npm run seed

# API em desenvolvimento
dev:
	npm run dev

# Testes
test:
	npm test
