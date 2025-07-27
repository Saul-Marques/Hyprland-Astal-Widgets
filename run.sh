#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# Change to the script's directory
cd "$DIR"

# Run the gjs script with LD_PRELOAD
LD_PRELOAD=/usr/lib/libgtk4-layer-shell.so.0 gjs "main.js"
