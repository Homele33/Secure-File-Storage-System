# Use Node.js base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (if exists)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app
COPY . .

# Expose app port (e.g. 3000)
EXPOSE 3000

# Run your app
CMD ["npm", "run", "dev"]
