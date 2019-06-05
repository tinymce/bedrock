FROM node:10-stretch
RUN apt-get update && apt-get install -y chromium chromedriver

WORKDIR /app/
RUN npm install -g yarn
COPY / /app/
RUN yarn install
RUN printf "#\!/usr/bin/env sh\nexec /usr/bin/chromedriver --whitelisted-ips= \$@\n" > /usr/local/bin/chromedriver && chmod +x /usr/local/bin/chromedriver
CMD bin/bedrock-auto.js -b chrome-headless --files sample/ts/client/SyncPassTest.ts sample/ts/client/SyncFailTest.ts --useSandboxForHeadless