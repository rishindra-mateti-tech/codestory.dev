#!/bin/bash
# Double-click this file on macOS to open CodeStory locally.
set -e

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js 20 or newer is required" message "Install Node.js from nodejs.org, then open CodeStory again."'
  exit 1
fi

if [ ! -d "node_modules" ]; then
  npm install
fi

exec node cli.js start
