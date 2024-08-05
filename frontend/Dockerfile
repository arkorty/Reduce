# Use a Node.js image with at least version 18.17.0
FROM node:18.17.0

# Set the working directory
WORKDIR /app

# Install bun
RUN curl -fsSL https://bun.sh/install | bash

# Set bun's binary path
ENV PATH="/root/.bun/bin:${PATH}"

# Copy the package.json and bun.lockb if available
COPY package*.json bun.lockb* ./

# Install dependencies using bun
RUN bun install

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["bun", "run", "dev"]
