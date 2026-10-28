FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY app.js server.js ./
USER node
EXPOSE 5001
CMD ["node", "server.js"]
