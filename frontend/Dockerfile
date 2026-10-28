# Build the dashboard, then serve the static files with nginx.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY public ./public
COPY src ./src
ARG REACT_APP_API_URL=http://localhost:5001
# Serve from / instead of the GitHub Pages path set in package.json "homepage".
ENV REACT_APP_API_URL=$REACT_APP_API_URL PUBLIC_URL=/
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
