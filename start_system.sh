#!/bin/bash

# GoCar Auto - System Ignition Script
# This script launches the Backend, Staff Interface, and Customer Portal.

# Text styling
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
ORANGE='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "  ____        ____                 _              _        "
echo " / ___| ___  / ___|__ _ _ __      / \  _   _    _| |_ ___  "
echo "| |  _ / _ \| |   / _' | '__|    / _ \| | | |  |_   _/ _ \ "
echo "| |_| | (_) | |__| (_| | |      / ___ \ |_| |    | || (_) |"
echo " \____|\___/ \____\__,_|_|     /_/   \_\__,_|    |_| \___/ "
echo "                                                           "
echo "        DIGITAL CONCIERGE & PRECISION ENGINEERING          "
echo -e "${NC}"

echo -e "${BOLD}SYSTEM IGNITION SEQUENCE STARTING...${NC}"
echo "----------------------------------------------------"

# Check for Docker
DOCKER_MODE=false
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}[INFO] Docker Compose detected.${NC}"
    DOCKER_MODE=true
else
    echo -e "${YELLOW}[WARN] Docker Compose not found. Falling back to local process management.${NC}"
fi

# Function to start via Docker
start_docker() {
    echo -e "${CYAN}[1/1] Launching containers via Docker Compose...${NC}"
    docker-compose up --build
}

# Function to start locally
start_local() {
    echo -e "${YELLOW}[INFO] Cleaning up existing processes on ports 3000, 5173, 5174...${NC}"
    fuser -k 3000/tcp 5173/tcp 5174/tcp &> /dev/null

    echo -e "${ORANGE}[1/3] Initializing Backend Unit...${NC}"
    npm start < /dev/null &
    BACKEND_PID=$!

    echo -e "${ORANGE}[2/3] Initializing Staff Command Center (Port 5173)...${NC}"
    (cd staff-interface && npm run dev -- --port 5173 < /dev/null) &
    STAFF_PID=$!

    echo -e "${ORANGE}[3/3] Initializing VIP Customer Portal (Port 5174)...${NC}"
    # Ensure correct path to customer-portal
    if [ -d "customer-portal" ]; then
        (cd customer-portal && npm run dev -- --port 5174 < /dev/null) &
        CUSTOMER_PID=$!
    else
        echo -e "${YELLOW}[WARN] customer-portal directory not found. Skipping...${NC}"
    fi

    echo "----------------------------------------------------"
    echo -e "${GREEN}${BOLD}ALL SYSTEMS ONLINE${NC}"
    echo -e "Backend:    ${CYAN}http://localhost:3000${NC}"
    echo -e "Staff UI:   ${CYAN}http://localhost:5173${NC}"
    echo -e "Client UI:  ${CYAN}http://localhost:5174${NC}"
    echo "----------------------------------------------------"
    echo "Press Ctrl+C to terminate all systems."

    # Wait for all processes
    trap "kill $BACKEND_PID $STAFF_PID $CUSTOMER_PID; exit" INT TERM
    wait
}

# Decision logic
if [ "$1" == "--local" ]; then
    start_local
elif [ "$DOCKER_MODE" = true ]; then
    echo -e "Starting in ${BOLD}DOCKER MODE${NC}. Use --local to run without containers."
    start_docker
else
    start_local
fi
