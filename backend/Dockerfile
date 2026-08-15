FROM node:20-bookworm-slim

# Install necessary compilers and tools
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    default-jdk \
    python3 \
    python-is-python3 \
    rustc \
    wget \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Install Zig
RUN wget https://ziglang.org/download/0.12.0/zig-linux-x86_64-0.12.0.tar.xz \
    && tar -xf zig-linux-x86_64-0.12.0.tar.xz \
    && mv zig-linux-x86_64-0.12.0 /usr/local/zig \
    && ln -s /usr/local/zig/zig /usr/local/bin/zig \
    && rm zig-linux-x86_64-0.12.0.tar.xz

# Set working directory
WORKDIR /app

ENV HOME=/tmp
ENV XDG_CACHE_HOME=/tmp/.cache
ENV XDG_DATA_HOME=/tmp/.local/share
ENV ZIG_GLOBAL_CACHE_DIR=/tmp/zig-cache
ENV ZIG_LOCAL_CACHE_DIR=/tmp/zig-local-cache
# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Ensure the temp directory exists and has correct permissions
RUN mkdir -p temp && chown -R node:node /app

# Switch to the non-root 'node' user for better security
USER node

# Expose port (Render sets PORT env variable)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
