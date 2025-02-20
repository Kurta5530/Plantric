#!/usr/bin/env bash
set -e

npm config get registry 
npm config set registry=https://registry.npmjs.org

echo 'Login'
npm login 

echo "Publish..."
npm publish

npm run docs

echo -e "\successful\n"
exit
