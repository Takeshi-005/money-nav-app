# ============================================
# ステージ1: 依存関係インストール
# ============================================
FROM node:20-bookworm-slim AS deps
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================
# ステージ2: ビルド
# ============================================
FROM node:20-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate
WORKDIR /app

# NEXT_PUBLIC_ 変数はビルド時に必要（クライアントサイドにバンドルされる）
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN --mount=type=secret,id=SUPABASE_SERVICE_ROLE_KEY \
    SUPABASE_SERVICE_ROLE_KEY=$(cat /run/secrets/SUPABASE_SERVICE_ROLE_KEY) \
    pnpm build


# ============================================
# ステージ3: 実行（最小構成）
# ============================================
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# 非rootユーザー作成
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standaloneモード用ファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

# standaloneサーバーを直接起動
CMD ["node", "server.js"]
