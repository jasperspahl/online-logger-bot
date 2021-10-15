From node:16

WORKDIR /usr/src/discord_bot

COPY . .

RUN npm i

Entrypoint ["/usr/src/discord_bot/entry_point"]
