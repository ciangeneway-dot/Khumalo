#!/bin/bash
# Build script for Vercel
echo "Starting build process..."
echo "Current directory: $(pwd)"
echo "Contents:"
ls -la
echo "Checking src directory:"
ls -la src/
echo "Running vite build..."
npm run build
