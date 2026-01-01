#!/bin/bash

# LunFit Auth Service - Quick Start Script
# This script helps you quickly set up and test the authentication service

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   LunFit Auth Service - Quick Start${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}[Step 1/5] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java is not installed. Please install Java 17 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites installed${NC}"
echo ""

# Step 2: Setup environment
echo -e "${YELLOW}[Step 2/5] Setting up environment...${NC}"

if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env

    # Update .env for local development with MailHog
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/authservice
DATABASE_USERNAME=authservice_user
DATABASE_PASSWORD=authservice_pass

# JWT Configuration
JWT_SECRET=YourSuperSecretKeyThatShouldBeAtLeast256BitsLongForHS256AlgorithmSecurity

# Email Configuration (MailHog for local testing)
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_SMTP_AUTH=false
MAIL_SMTP_STARTTLS=false
MAIL_FROM=noreply@lunfit.com

# Application Configuration
BASE_URL=http://localhost:8080

# Spring Profile
SPRING_PROFILES_ACTIVE=dev
EOF
    echo -e "${GREEN}✅ Created .env file configured for local development${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Step 3: Start infrastructure
echo -e "${YELLOW}[Step 3/5] Starting Docker containers...${NC}"
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 5

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker containers started successfully${NC}"
    echo "   - PostgreSQL: localhost:5432"
    echo "   - MailHog SMTP: localhost:1025"
    echo "   - MailHog UI: http://localhost:8025"
else
    echo -e "${RED}❌ Failed to start Docker containers${NC}"
    docker-compose logs
    exit 1
fi
echo ""

# Step 4: Build application
echo -e "${YELLOW}[Step 4/5] Building application...${NC}"
./mvnw clean compile
echo -e "${GREEN}✅ Application built successfully${NC}"
echo ""

# Step 5: Instructions
echo -e "${YELLOW}[Step 5/5] Setup complete!${NC}"
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Ready to start testing!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Start the application:"
echo -e "   ${YELLOW}./mvnw spring-boot:run${NC}"
echo ""
echo "2. Open MailHog to view test emails:"
echo -e "   ${YELLOW}http://localhost:8025${NC}"
echo ""
echo "3. Test the registration endpoint:"
echo -e "   ${YELLOW}curl -X POST http://localhost:8080/api/v1/auth/register \\${NC}"
echo -e "   ${YELLOW}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "   ${YELLOW}  -d '{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}'${NC}"
echo ""
echo "4. Check the verification email in MailHog and copy the token"
echo ""
echo "5. Verify your email:"
echo -e "   ${YELLOW}curl -X GET \"http://localhost:8080/api/v1/auth/verify?token=YOUR_TOKEN\"${NC}"
echo ""
echo "6. Login:"
echo -e "   ${YELLOW}curl -X POST http://localhost:8080/api/v1/auth/login \\${NC}"
echo -e "   ${YELLOW}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "   ${YELLOW}  -d '{\"email\": \"test@example.com\", \"password\": \"Test123!@#\"}'${NC}"
echo ""
echo -e "${BLUE}For detailed testing instructions, see:${NC} TESTING.md"
echo ""
echo -e "${BLUE}To stop services:${NC}"
echo -e "   ${YELLOW}docker-compose down${NC}"
echo ""
echo -e "${GREEN}Happy testing! 🚀${NC}"
