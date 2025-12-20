#!/bin/bash
set -e

# Mobigen Terraform Deployment Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$TERRAFORM_DIR")"

# Default values
ENVIRONMENT="${ENVIRONMENT:-staging}"
ACTION="${1:-plan}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    command -v terraform >/dev/null 2>&1 || error "terraform is required but not installed"
    command -v aws >/dev/null 2>&1 || error "aws cli is required but not installed"

    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials not configured"

    log "Prerequisites check passed"
}

# Check for secrets file
check_secrets() {
    SECRETS_FILE="${TERRAFORM_DIR}/environments/${ENVIRONMENT}/secrets.tfvars"

    if [ ! -f "$SECRETS_FILE" ]; then
        error "Secrets file not found: $SECRETS_FILE\nCopy secrets.tfvars.example and fill in the values"
    fi
}

# Run terraform
run_terraform() {
    cd "$TERRAFORM_DIR"

    local tfvars="${TERRAFORM_DIR}/environments/${ENVIRONMENT}/terraform.tfvars"
    local secrets="${TERRAFORM_DIR}/environments/${ENVIRONMENT}/secrets.tfvars"

    case "$ACTION" in
        init)
            log "Initializing Terraform..."
            terraform init
            ;;
        plan)
            log "Planning Terraform changes for ${ENVIRONMENT}..."
            terraform plan \
                -var-file="$tfvars" \
                -var-file="$secrets"
            ;;
        apply)
            log "Applying Terraform changes for ${ENVIRONMENT}..."
            terraform apply \
                -var-file="$tfvars" \
                -var-file="$secrets"
            ;;
        destroy)
            warn "This will destroy all resources in ${ENVIRONMENT}!"
            read -p "Are you sure? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                terraform destroy \
                    -var-file="$tfvars" \
                    -var-file="$secrets"
            else
                log "Cancelled"
            fi
            ;;
        output)
            terraform output
            ;;
        *)
            error "Unknown action: $ACTION\nUsage: $0 [init|plan|apply|destroy|output]"
            ;;
    esac
}

# Build and push Docker images
push_images() {
    log "Building and pushing Docker images..."

    # Get AWS account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    REGION=$(aws configure get region || echo "us-east-1")
    ECR_URL="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

    # Login to ECR
    aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ECR_URL"

    # Build and push each service
    for service in web generator builder; do
        local image_tag="mobigen-${ENVIRONMENT}/${service}:latest"
        local ecr_tag="${ECR_URL}/${image_tag}"

        log "Building $service..."

        if [ "$service" = "web" ]; then
            docker build -t "$image_tag" -f "${PROJECT_ROOT}/apps/web/Dockerfile" "$PROJECT_ROOT"
        else
            docker build -t "$image_tag" -f "${PROJECT_ROOT}/services/${service}/Dockerfile" "$PROJECT_ROOT"
        fi

        docker tag "$image_tag" "$ecr_tag"
        docker push "$ecr_tag"

        log "Pushed $ecr_tag"
    done

    log "All images pushed successfully"
}

# Update ECS services to use new images
update_services() {
    log "Updating ECS services..."

    CLUSTER="mobigen-${ENVIRONMENT}-cluster"

    for service in web generator builder; do
        log "Updating $service service..."
        aws ecs update-service \
            --cluster "$CLUSTER" \
            --service "mobigen-${ENVIRONMENT}-${service}" \
            --force-new-deployment \
            --no-cli-pager
    done

    log "Services updated. Monitor deployment in AWS Console."
}

# Main
main() {
    check_prerequisites

    case "$ACTION" in
        push-images)
            push_images
            ;;
        update-services)
            update_services
            ;;
        deploy)
            check_secrets
            run_terraform plan
            read -p "Apply these changes? (yes/no): " confirm
            if [ "$confirm" = "yes" ]; then
                ACTION=apply
                run_terraform
            fi
            ;;
        *)
            check_secrets
            run_terraform
            ;;
    esac
}

main
