# Multi-stage build for Next.js (output: standalone)

# Define once, reuse across stages
ARG BASE_IMAGE=node:20-alpine

FROM ${BASE_IMAGE} AS deps
ENV NODE_ENV=development
WORKDIR /app
COPY package.json package-lock.json* ./
# If lockfile exists, use ci; otherwise fall back to install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM ${BASE_IMAGE} AS builder
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN echo "Building with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}" && npm run build

FROM ${BASE_IMAGE} AS runner
ARG NEXT_PUBLIC_API_URL
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    PORT=3000
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodegrp && adduser -S nodeusr -u 1001 -G nodegrp

# Copy standalone output and public assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nodeusr
EXPOSE 3000

CMD ["node", "server.js"]


