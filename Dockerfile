FROM oven/bun:1.3.12-debian
RUN apt-get update && apt-get install -y chromium

WORKDIR /app/
COPY / /app/
RUN bun install
CMD bun run bedrock-auto -b chrome-headless --files sample/ts/client/SyncPassTest.ts sample/ts/client/SyncFailTest.ts --useSandboxForHeadless
