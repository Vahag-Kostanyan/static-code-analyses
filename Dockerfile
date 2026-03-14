FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source
COPY . .

EXPOSE 3000

# Start the API + UI server
CMD ["npm", "start"]