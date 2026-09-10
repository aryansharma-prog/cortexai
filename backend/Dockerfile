FROM node:20-slim

WORKDIR /app

# Copy root backend package files
COPY backend/package*.json ./
RUN npm install

# Copy individual service package files and install dependencies
COPY backend/gateway/package*.json ./gateway/
RUN cd gateway && npm install

COPY backend/services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install

COPY backend/services/chat/package*.json ./services/chat/
RUN cd services/chat && npm install

COPY backend/services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

COPY backend/services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install

# Copy all backend source code into /app
COPY backend/ .

EXPOSE 8000

CMD ["node", "server.js"]
