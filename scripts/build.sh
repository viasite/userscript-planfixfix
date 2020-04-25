#!/bin/bash
set -eu

# build from src/
rm -rf dist && mkdir dist
cat src/* > dist/planfixfix.user.js

# version update
version="$(cat package.json | grep '"version": "[0-9]' | cut -d':' -f2  | cut -d'"' -f2)"
echo "$version"
sed -i 's/@version.*/@version        '"${version}"'/g' dist/planfixfix.user.js
