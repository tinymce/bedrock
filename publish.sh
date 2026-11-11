#!/usr/bin/env bash
# Manually publish packages to npm (mirrors the Jenkins publish stage).
# Publishes any package whose package.json version isn't on the registry yet.
set -euo pipefail

cd "$(dirname "$0")"

yarn build
yarn lerna publish from-package --ignore-changes @ephox/bedrock-sample "$@"
