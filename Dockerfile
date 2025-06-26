# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
# RUN npm run build
#
# # Production stage
# FROM node:18-alpine
#
# WORKDIR /app
#
# # Copy package files
# COPY package*.json ./
#
# # Install production dependencies only
# RUN npm install
#
# # Copy built files from builder stage
# COPY --from=builder /app/dist ./dist
#
# # Copy prisma schema and migrations
# COPY prisma ./prisma
#
# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the application (optionally run migrations)
CMD ["sh", "-c", "npx prisma migrate deploy && npm dev"] 
