#!/bin/bash

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating new virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
    pip install -e .
else
    echo "Virtual environment found. Activating..."
    source venv/bin/activate
fi

# Verify pip is working and show python version
python --version
pip --version

echo "Environment is ready!"