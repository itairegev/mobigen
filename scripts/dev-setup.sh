#!/bin/bash

# =============================================================================
# Mobigen Local Development Setup Script
# =============================================================================
# This script sets up the local development environment for Mobigen
# Usage: ./scripts/dev-setup.sh [--full | --infra-only | --reset]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing=()

    if ! command_exists docker; then
        missing+=("docker")
    fi

    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing+=("docker-compose")
    fi

    if ! command_exists node; then
        missing+=("node")
    fi

    if ! command_exists pnpm; then
        missing+=("pnpm")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        echo ""
        echo "Please install the following:"
        echo "  - Docker: https://docs.docker.com/get-docker/"
        echo "  - Node.js 20+: https://nodejs.org/"
        echo "  - pnpm: npm install -g pnpm"
        exit 1
    fi

    log_success "All prerequisites met!"
}

# Setup environment file
setup_env() {
    log_info "Setting up environment..."

    if [ ! -f .env ]; then
        cp .env.example .env
        log_success "Created .env from .env.example"
        log_warn "Please update .env with your actual values (especially ANTHROPIC_API_KEY)"
    else
        log_info ".env already exists, skipping..."
    fi
}

# Start infrastructure services
start_infrastructure() {
    log_info "Starting infrastructure services (PostgreSQL, Redis, MinIO)..."

    # Start only infrastructure (no profiles = just postgres, redis, minio)
    if docker compose version >/dev/null 2>&1; then
        docker compose up -d postgres redis minio
    else
        docker-compose up -d postgres redis minio
    fi

    log_info "Waiting for services to be healthy..."
    sleep 5

    # Check PostgreSQL
    local retries=30
    while [ $retries -gt 0 ]; do
        if docker exec mobigen-postgres pg_isready -U mobigen -d mobigen >/dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            break
        fi
        retries=$((retries - 1))
        sleep 1
    done

    if [ $retries -eq 0 ]; then
        log_error "PostgreSQL failed to start"
        exit 1
    fi

    # Check Redis
    if docker exec mobigen-redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis is ready!"
    else
        log_error "Redis failed to start"
        exit 1
    fi

    log_success "Infrastructure services started!"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    pnpm install
    log_success "Dependencies installed!"
}

# Setup database
setup_database() {
    log_info "Setting up database..."

    # Generate Prisma client
    pnpm --filter @mobigen/db prisma generate

    # Run migrations
    pnpm --filter @mobigen/db prisma db push

    log_success "Database setup complete!"
}

# Build packages
build_packages() {
    log_info "Building packages..."

    # Build in dependency order
    pnpm --filter @mobigen/ai build
    pnpm --filter @mobigen/storage build
    pnpm --filter @mobigen/testing build
    pnpm --filter @mobigen/ui build

    log_success "Packages built!"
}

# Create MinIO buckets
setup_minio() {
    log_info "Setting up MinIO buckets..."

    # Wait for MinIO to be ready
    sleep 3

    # Create buckets using mc (MinIO client) inside the container
    docker exec mobigen-minio sh -c "
        mc alias set local http://localhost:9000 minio_admin minio_password 2>/dev/null || true
        mc mb local/mobigen-projects --ignore-existing 2>/dev/null || true
        mc mb local/mobigen-artifacts --ignore-existing 2>/dev/null || true
        mc mb local/mobigen-screenshots --ignore-existing 2>/dev/null || true
    " 2>/dev/null || log_warn "MinIO bucket setup skipped (mc not available in container)"

    log_success "MinIO setup complete!"
}

# Initialize bare template repos
setup_templates() {
    log_info "Setting up template repositories..."

    if [ -d templates-bare ] && [ "$(ls -A templates-bare 2>/dev/null)" ]; then
        log_info "Template bare repos already exist"
    else
        mkdir -p templates-bare

        for template in base ecommerce loyalty news ai-assistant; do
            if [ -d "templates/$template" ]; then
                log_info "Initializing bare repo for $template..."
                mkdir -p "templates-bare/$template.git"
                (cd "templates-bare/$template.git" && git init --bare) 2>/dev/null || true

                # Initialize the template as a git repo and push to bare
                if [ -d "templates/$template" ]; then
                    (cd "templates/$template" && \
                        git init 2>/dev/null || true && \
                        git add -A 2>/dev/null || true && \
                        git commit -m "Initial commit" 2>/dev/null || true && \
                        git remote add origin "../../templates-bare/$template.git" 2>/dev/null || true && \
                        git push -u origin HEAD:main 2>/dev/null || true) 2>/dev/null || true
                fi
            fi
        done
    fi

    log_success "Templates setup complete!"
}

# Print status
print_status() {
    echo ""
    echo "=============================================="
    echo "  Mobigen Development Environment Ready!"
    echo "=============================================="
    echo ""
    echo "Services:"
    echo "  - PostgreSQL: localhost:5432"
    echo "  - Redis:      localhost:6379"
    echo "  - MinIO:      localhost:9000 (Console: localhost:9001)"
    echo ""
    echo "MinIO Console Credentials:"
    echo "  - Username: minio_admin"
    echo "  - Password: minio_password"
    echo ""
    echo "Start development servers:"
    echo "  pnpm dev                    # Start all services"
    echo "  pnpm --filter @mobigen/web dev    # Start only web dashboard"
    echo ""
    echo "Or start with Docker Compose:"
    echo "  docker compose --profile full up -d"
    echo ""
    log_warn "Remember to set ANTHROPIC_API_KEY in .env for AI generation!"
    echo ""
}

# Stop all services
stop_services() {
    log_info "Stopping all services..."

    if docker compose version >/dev/null 2>&1; then
        docker compose down
    else
        docker-compose down
    fi

    log_success "Services stopped!"
}

# Reset everything
reset_all() {
    log_warn "This will delete all data (database, redis, minio)!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Resetting environment..."

        if docker compose version >/dev/null 2>&1; then
            docker compose down -v
        else
            docker-compose down -v
        fi

        rm -rf node_modules
        rm -rf templates-bare

        log_success "Environment reset complete!"
    else
        log_info "Reset cancelled"
    fi
}

# Main function
main() {
    echo ""
    echo "=============================================="
    echo "  Mobigen Local Development Setup"
    echo "=============================================="
    echo ""

    case "${1:-}" in
        --full)
            check_prerequisites
            setup_env
            start_infrastructure
            install_dependencies
            setup_database
            build_packages
            setup_minio
            setup_templates
            print_status
            ;;
        --infra-only)
            check_prerequisites
            setup_env
            start_infrastructure
            setup_minio
            log_success "Infrastructure started! Run 'pnpm install' and 'pnpm dev' to start development."
            ;;
        --stop)
            stop_services
            ;;
        --reset)
            reset_all
            ;;
        --help|-h)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  --full        Full setup (infrastructure + dependencies + database)"
            echo "  --infra-only  Start only infrastructure services"
            echo "  --stop        Stop all services"
            echo "  --reset       Reset everything (WARNING: deletes all data)"
            echo "  --help        Show this help message"
            echo ""
            echo "Default (no options): Same as --full"
            ;;
        *)
            check_prerequisites
            setup_env
            start_infrastructure
            install_dependencies
            setup_database
            build_packages
            setup_minio
            setup_templates
            print_status
            ;;
    esac
}

# Run main
main "$@"
