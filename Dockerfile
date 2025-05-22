FROM oven/bun:alpine

WORKDIR /app
EXPOSE 3000

COPY ./package.json ./bun.lock /app/
RUN bun install

COPY ./server/ /app
CMD [ "bun", "/app/index.mjs" ]
