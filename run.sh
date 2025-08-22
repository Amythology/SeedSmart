#!/bin/bash

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
source .venv/bin/activate

# # Check if MongoDB is running
# if ! pgrep -x "mongod" > /dev/null; then
#     echo "Warning: MongoDB doesn't appear to be running."
#     echo "Please start MongoDB first: sudo systemctl start mongod"
# fi

# Run the application
echo "Starting Farmers Market API..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
