#!/bin/bash
set -e

echo -e "\033[95m[deploy]\033[0m starting deployment..."

PM2_APP_NAME=struggleant
SHELL_PATH=$(dirname $0)

cd $SHELL_PATH
cd ..
# pull code
echo -e "\033[95m[git]\033[0m pulling from GitHub..."
echo -e "\033[95m[git]\033[0m path: \033[36m"$(pwd)"\033[0m"
git fetch origin main && git reset --hard origin/main && git pull origin main
git checkout main
echo -e "\033[95m[git]\033[0m pulled main."
# install dependencies
echo -e "\033[95m[install]\033[0m installing dependencies..."
npm install
echo -e "\033[95m[install]\033[0m installed."
# stop server
echo -e "\033[95m[server]\033[0m stopping server..."
pm2 stop $PM2_APP_NAME -s
echo -e "\033[95m[server]\033[0m server: \033[36m${PM2_APP_NAME}\033[0m is stopped."
# build
echo -e "\033[95m[build]\033[0m building..."
npm run build:prod
echo -e "\033[95m[build]\033[0m built."
# restart server
echo -e "\033[95m[server]\033[0m restarting server..."
pm2 restart $PM2_APP_NAME
echo -e "\033[95m[server]\033[0m server: \033[36m${PM2_APP_NAME}\033[0m is online."

echo -e "\033[95m[deploy]\033[0m \033[32mAll done. ^_-\033[0m"
