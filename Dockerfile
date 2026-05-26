FROM node:24-alpine
LABEL app_name="notification-preferences-service"

WORKDIR /app

# 1) Манифесты зависимостей и установка пакетов.
#    Слой инвалидируется только при изменении package.json / package-lock.json —
#    изменения в src/, конфигах НЕ приводят к повторному npm i.
COPY package.json package-lock.json ./
RUN npm i

# 2) Конфиги и исходный код — меняются чаще, но не требуют пересборки node_modules.
COPY .default.env .example.env nest-cli.json tsconfig.build.json tsconfig.json ./
# .env опционален: если есть в build-контексте — попадёт, если нет — создадим ниже из .example.env
COPY .env* ./
COPY src src
COPY migrations migrations

# Формирование .env: если его нет — копируем из .example.env (аналог `make i`)
RUN if [ ! -f .env ]; then cp .example.env .env; fi
