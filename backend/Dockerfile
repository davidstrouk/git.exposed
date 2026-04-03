FROM node:20-slim AS base

RUN apt-get update && apt-get install -y curl tar && rm -rf /var/lib/apt/lists/*

# Install Betterleaks v1.1.1
RUN curl -sSL https://github.com/betterleaks/betterleaks/releases/download/v1.1.1/betterleaks_1.1.1_linux_x64.tar.gz -o /tmp/betterleaks.tar.gz \
    && tar xzf /tmp/betterleaks.tar.gz -C /usr/local/bin betterleaks \
    && chmod +x /usr/local/bin/betterleaks \
    && rm /tmp/betterleaks.tar.gz

# Install Trivy
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# Install OpenGrep v1.16.5
RUN curl -sSL https://github.com/opengrep/opengrep/releases/download/v1.16.5/opengrep_manylinux_x86 -o /usr/local/bin/opengrep \
    && chmod +x /usr/local/bin/opengrep

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4000
CMD ["npx", "tsx", "src/index.ts"]
