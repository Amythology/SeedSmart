#!/bin/bash

echo "Starting SeedSmart Frontend..."
echo "Frontend available at: http://localhost:8080"
echo "Make sure your backend is running on http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"

# Check if Python is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m http.server 8080
else
    echo "Python not found. Please install Python to run the server."
    echo "Alternatively, you can use any other static file server."
fi
