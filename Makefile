install:
	docker-compose -f docker-compose.builder.yml run --rm install
start:
	docker-compose -f docker-compose.dev.yml up
stop:
	docker-compose -f docker-compose.dev.yml down --remove-orphans
build:
	docker-compose -f docker-compose.builder.yml run --rm build
bash:
	docker-compose -f docker-compose.builder.yml run --rm bash
reset:
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
schema:
	docker-compose -f docker-compose.builder.yml run --rm schema