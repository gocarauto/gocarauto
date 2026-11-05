#!/bin/bash
echo "Stopping GoCar Auto Systems..."
fuser -k 3000/tcp 2>/dev/null
fuser -k 5173/tcp 2>/dev/null
fuser -k 5174/tcp 2>/dev/null
echo "All processes on ports 3000, 5173, and 5174 have been terminated."
