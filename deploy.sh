#!/bin/bash

# Football Standings Simulator Deployment Script
# This script builds the application and prepares it for deployment to aidenlyons.com/StandingsSimulator

echo "🏗️  Building the Football Standings Simulator..."
NODE_ENV=production npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"
echo "📦 Output files are in the 'out' directory"
echo ""

# Set paths - update these with your actual paths
WEBSITE_REPO="$HOME/Documents/Github/personal-website"
TARGET_DIR="$WEBSITE_REPO/StandingsSimulator"

# Show menu
echo "What would you like to do?"
echo "1) Copy files to personal website repo"
echo "2) Test locally with http-server"
echo "3) Exit"
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo "Copying files to $TARGET_DIR..."
    
    # Check if directory exists
    if [ ! -d "$WEBSITE_REPO" ]; then
      echo "❌ Website repository directory not found at $WEBSITE_REPO"
      echo "Please update the script with the correct path."
      exit 1
    fi
    
    # Create directory if it doesn't exist
    mkdir -p "$TARGET_DIR"
    
    # Copy files
    cp -r out/* "$TARGET_DIR/"
    
    echo "✅ Files copied successfully!"
    echo ""
    echo "Now you need to commit and push these changes:"
    echo "  cd $WEBSITE_REPO"
    echo "  git status  # Check what files were changed"
    echo "  git add StandingsSimulator"
    echo "  git commit -m \"Update Football Standings Simulator\""
    echo "  git push"
    ;;
    
  2)
    echo "Starting local test server..."
    # Check if http-server is installed
    if ! command -v npx &> /dev/null; then
      echo "❌ npx not found. Please make sure Node.js is installed."
      exit 1
    fi
    
    echo "Starting server in the out directory..."
    echo "Access your site at: http://localhost:8080"
    echo "Press Ctrl+C to stop the server."
    cd out && npx http-server -p 8080
    ;;
    
  3)
    echo "Exiting."
    exit 0
    ;;
    
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac 