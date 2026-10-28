# Next.js production image (standalone output). Build from the repository root:
#   docker build -f apps/web/Dockerfile -t lerevenu-web .
# Public values the browser needs are baked at build time (build args); secrets come at run time.

FROM node:24-alpine AS base
RUN corepack enable && apk add --no-cache libc6-compat
WORKDIR /repo

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/typescript-config/package.json packages/typescript-config/
RUN pnpm install --frozen-lockfile --filter web...

FROM deps AS build
COPY packages packages
COPY apps/web apps/web
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
ARG NEXT_PUBLIC_GOOGLE_LOGIN=false
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_STRAPI_URL=$NEXT_PUBLIC_STRAPI_URL \
    NEXT_PUBLIC_GOOGLE_LOGIN=$NEXT_PUBLIC_GOOGLE_LOGIN \
    NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
# No secret at build time: the env schema is skipped here and checked again when the container boots.
RUN cd apps/web && SKIP_ENV_VALIDATION=1 pnpm exec next build

FROM node:24-alpine AS runtime
RUN apk add --no-cache wget
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
# The standalone server traces the monorepo root, so the files keep their apps/web/ prefix.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=10 \
  CMD wget -qO- http://127.0.0.1:3000/discussions || exit 1
CMD ["node", "apps/web/server.js"]
