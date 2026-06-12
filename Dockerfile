FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
RUN mkdir -p /app/data
ENV PORT=5757
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
EXPOSE 5757
VOLUME ["/app/data"]
CMD ["node", "server.js"]
