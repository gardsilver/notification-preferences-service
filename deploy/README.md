# Deploy

Минимальные настройки локальной среды разработки: **Postgres**, **Redis** (**Redis Insight**) и сам микросервис **Notification Preferences Service**.

## ВНИМАНИЕ

Не использовать в **production**! Предназначено только для локальной разработки.

## Состав

- `base-compose.yml` — описание контейнеров инфраструктуры (Postgres, Redis, Redis Insight).
- `notification-preferences-service.yml` — overlay для запуска самого микросервиса в Docker (сборка из корня репозитория, команда `npm run start:dev`, порты `3000:3000` и `3001:3001`; исходники синхронизируются в контейнер через Docker Compose Watch, см. ниже).
- `makefile` — набор команд для управления инфраструктурой (см. ниже).

Все команды `docker compose` применяют оба файла одновременно (`-f base-compose.yml -f notification-preferences-service.yml`). Сеть `dev-local` (bridge).

## Установка и настройка

Все часто используемые команды указаны в `makefile`. Запускаются **из каталога `deploy/`**. Базовые команды (`dc-start`, `dc-watch`, `dc-stop`, `dc-logs`) также проксированы в корневой `makefile` — их можно вызывать из корня проекта.

| **make**-команда | Описание |
|---|---|
| `make dc-start` | Поднимает все контейнеры (`docker compose ... up -d`) **и запускает Docker Compose Watch в фоне**. Терминал не блокируется. |
| `make dc-watch` | Перезапускает фоновый watch-процесс (если упал или нужно обновить). Не блокирует терминал. |
| `make dc-watch-log` | Follow лога фонового watch (`tail -f $(WATCH_LOG)`). Блокирующий, `Ctrl+C` останавливает только просмотр. |
| `make dc-stop` | Останавливает **фоновый watch и все контейнеры** (`docker compose ... down`). |
| `make dc-rm-all` | Останавливает контейнеры и полностью очищает Docker (`system prune` с volumes и images). |
| `make dc-down-postgres` | Останавливает **Postgres**. |
| `make dc-down-redis` | Останавливает **Redis**. |
| `make dc-down` | Останавливает микросервис **Notification Preferences Service**. |
| `make dc-logs` | Показывает последние 50 строк логов микросервиса **Notification Preferences Service** с отслеживанием. |

После успешного запуска будут доступны следующие контейнеры:

- **postgresdb** — **Postgres** (`postgres:latest`).
- **redis** — **Redis** (`redis:latest`).
- **redis-ui** — Web-клиент **Redis Insight** (`redis/redisinsight:latest`).
- **notification-preferences-service** — сам микросервис (собирается из `../Dockerfile` или контекста `../`, запускается `npm run start:dev`).

## Сетевое взаимодействие

Все контейнеры подключены к bridge-сети `dev-local`. Микросервис обращается к инфраструктурным сервисам **по именам контейнеров** (`postgresdb`, `redis`); с хоста (`localhost`) — через проброшенные порты (ниже).

## **Postgres**

Образ `postgres:latest`. Переменные окружения заданы в `base-compose.yml`: `POSTGRES_USER=vagrant`, `POSTGRES_PASSWORD=vagrant`, `POSTGRES_DB=notification`, `TZ=Europe/Moscow`, `PGTZ=Europe/Moscow`.

| Параметр | Описание | `.env` микросервиса | localhost |
|---|---|---|---|
| `HOST` | Host **Postgres** | `DATABASE_HOST=postgresdb` | `host=localhost` |
| `PORT` | Port **Postgres** | `DATABASE_PORT=5432` | `port=5432` |
| `DATABASE` | База данных | `DATABASE_NAME=notification` | `database=notification` |
| `USER` | Имя пользователя | `DATABASE_USER=vagrant` | `user=vagrant` |
| `PASSWORD` | Пароль пользователя | `DATABASE_PASSWORD=vagrant` | `password=vagrant` |

## **Redis**

Образ `redis:latest`, запускается с флагом `--appendonly yes` (персистентность через AOF).

| Параметр | Описание | `.env` микросервиса | localhost |
|---|---|---|---|
| `HOST` | Host для подключения к **Redis** | `REDIS_CACHE_MANAGER_HOST=redis` | `host=localhost` |
| `PORT` | Port для подключения к **Redis** | `REDIS_CACHE_MANAGER_PORT=6379` | `port=6379` |

- <http://localhost:5540> — **Redis Insight** (автоматически подключён к `redis:6379` через переменные `RI_REDIS_HOST` / `RI_REDIS_PORT`).


## Микросервис в контейнере

`notification-preferences-service.yml` собирает образ из корня репозитория (`context: ../`) и запускает `npm --prefix=/app run start:dev`. Проброшенные порты: `3000:3000` (HTTP/Swagger/WebSocket) и `3001:3001` (gRPC). Исходники **не** монтируются через bind-mount — это исключает конфликты прав между хостом и контейнером (node_modules/dist на хосте не перетираются владельцем `root` из контейнера).

### Режим разработки через Docker Compose Watch

Типичный dev-workflow — две команды из корня проекта:

```bash
make dc-start   # поднимает контейнеры detached + запускает Docker Compose Watch в фоне (PID в /tmp/docker-compose-$UID/nps-watch.pid)
make dc-logs    # follow логов микросервиса
```

Если watch-процесс по каким-то причинам упал или нужно его перезапустить — `make dc-watch` (безопасно вызывать многократно; убивает старый процесс и поднимает новый). Для наблюдения за самим watch-процессом — `make dc-watch-log`. Остановка всего — `make dc-down`.

Compose следит за файлами на хосте и автоматически пробрасывает изменения в контейнер без bind-mount:

| Что меняется | Действие watch | Что происходит |
|---|---|---|
| `src/**`, `migrations/**` | `sync` | Файлы копируются в контейнер; `nest start --watch` сам перезапускает Node-процесс (без рестарта контейнера). |
| `tsconfig.json`, `tsconfig.build.json`, `nest-cli.json`, `.env` | `sync+restart` | Файл копируется + контейнер перезапускается (несколько секунд). |
| `package.json`, `package-lock.json` | `rebuild` | Пересобирается образ с новым `npm i`. |

Watch-блок описан в `develop.watch` в `notification-preferences-service.yml`. Начальное состояние `src/`, `migrations/`, `node_modules/` попадает в образ через `COPY` в `Dockerfile` — хосту эти директории **не нужны для запуска контейнера**, но нужны для IDE (автокомплит TypeScript, ESLint, Jest). Устанавливаются той же командой [`make i`](../README.md#4-команды) из корня проекта.
