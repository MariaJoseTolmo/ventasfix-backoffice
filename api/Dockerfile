FROM node:20-alpine

# bcrypt compiles a native addon; build tools are needed even though alpine
# (musl) has no prebuilt binary for every version.
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN chmod +x docker-entrypoint.sh \
  && addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app

USER app

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "start"]
