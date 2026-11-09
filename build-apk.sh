#!/bin/bash

# Build script for Arcanist APK with proper naming convention and builds directory
# Usage: ./build-apk.sh

# Get current date and time in the desired format
DATETIME=$(date +"%m%d%Y-%H%M")
PROJECT_NAME="arcanist"
BUILDS_DIR="builds"
LATEST_APK_NAME="${PROJECT_NAME}-latest-${DATETIME}.apk"
REGULAR_APK_NAME="${PROJECT_NAME}-${DATETIME}.apk"

# Ensure builds directory exists
mkdir -p "$BUILDS_DIR"

echo "Building APK: ${LATEST_APK_NAME}"
echo "Starting EAS build..."

# Run the EAS build command
eas build --platform android --profile preview --local

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build completed successfully!"
    
    # Find the most recent build file
    LATEST_BUILD=$(ls -t build-*.apk 2>/dev/null | head -n1)
    
    if [ -n "$LATEST_BUILD" ]; then
        # Remove "-latest" from any existing APK files in builds directory
        echo "Removing '-latest' from previous builds..."
        for file in "$BUILDS_DIR"/${PROJECT_NAME}-latest-*.apk; do
            if [ -f "$file" ]; then
                # Extract the date-time part from the filename
                basename_file=$(basename "$file")
                new_name=$(echo "$basename_file" | sed "s/${PROJECT_NAME}-latest-/${PROJECT_NAME}-/")
                mv "$file" "$BUILDS_DIR/$new_name"
                echo "Renamed: $basename_file -> $new_name"
            fi
        done
        
        # Move the new build to builds directory with latest naming
        mv "$LATEST_BUILD" "$BUILDS_DIR/$LATEST_APK_NAME"
        echo "APK saved as: ${BUILDS_DIR}/${LATEST_APK_NAME}"
        echo "Build location: $(pwd)/${BUILDS_DIR}/${LATEST_APK_NAME}"
        
        # List all builds in the directory
        echo ""
        echo "All builds in ${BUILDS_DIR}:"
        ls -la "$BUILDS_DIR"/*.apk 2>/dev/null || echo "No APK files found"
    else
        echo "Warning: Could not find build file to rename"
    fi
else
    echo "Build failed!"
    exit 1
fi
