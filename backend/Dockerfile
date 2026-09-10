FROM node:20-slim

WORKDIR /app

# Copy root backend package files and install
COPY package*.json ./
RUN npm install

# Copy individual service package files and install dependencies
COPY ./gateway/package*.json ./gateway/
RUN cd gateway && npm install

COPY ./services/auth/package*.json ./services/auth/
RUN cd services/auth && npm install

COPY ./services/chat/package*.json ./services/chat/
RUN cd services/chat && npm install

COPY ./services/agent/package*.json ./services/agent/
RUN cd services/agent && npm install

COPY ./services/billing/package*.json ./services/billing/
RUN cd services/billing && npm install

# Copy entire backend source code
COPY . .

# Expose default port
EXPOSE 8000

# Start all microservices unified runner
CMD ["node", "server.js"]
