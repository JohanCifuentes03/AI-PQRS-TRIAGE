FROM node:20-alpine

RUN apk add --no-cache poppler-utils

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY server.mjs .

EXPOSE 4100
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4100/health || exit 1

CMD ["node", "server.mjs"]
