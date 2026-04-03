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

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc ./

# Copy package.json files for all workspaces (for install)
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

WORKDIR /app/apps/api

EXPOSE 4000
CMD ["npx", "tsx", "src/index.ts"]
