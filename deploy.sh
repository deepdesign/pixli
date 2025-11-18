#!/bin/bash
# Deployment script for pixli.jamescutts.me

set -e  # Exit on any error

REPO_DIR="/var/www/pixli.jamescutts.me"
BUILD_DIR="$REPO_DIR/dist"
HTML_DIR="$REPO_DIR/html"
NPM_CACHE="/var/www/.npm"

# Ensure npm cache directory exists with correct permissions
sudo mkdir -p "$NPM_CACHE"
sudo chown -R www-data:www-data "$NPM_CACHE"

# Check if directory is a git repository, if not clone it
if [ ! -d "$REPO_DIR/.git" ]; then
    echo "Repository not found. Cloning..."
    sudo rm -rf "$REPO_DIR"
    sudo -u www-data git clone https://github.com/deepdesign/pixli.git "$REPO_DIR"
fi

# Change to repository directory
cd "$REPO_DIR" || exit 1

# Ensure correct ownership
sudo chown -R www-data:www-data "$REPO_DIR"

# Update code as www-data user
sudo -u www-data git fetch --all --prune
sudo -u www-data git reset --hard origin/main

# Install dependencies (must be in the repo directory where package-lock.json exists)
sudo -u www-data env NPM_CONFIG_CACHE="$NPM_CACHE" npm ci --no-audit --no-fund

# Build the project (must be in the repo directory)
sudo -u www-data env NPM_CONFIG_CACHE="$NPM_CACHE" npm run build

# Point docroot to the new build
sudo ln -sfn "$BUILD_DIR" "$HTML_DIR"

echo "Deployment complete!"
