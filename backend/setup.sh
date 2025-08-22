#!/bin/bash

# Setup script for Farmers Market Backend

echo "Setting up Farmers Market Backend..."

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "Setup completed!"
echo ""
echo "To run the application:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Make sure MongoDB is running on localhost:27017"
echo "3. Run the application: uvicorn main:app --reload"
echo "4. Access API docs at: http://localhost:8000/docs"
echo ""
