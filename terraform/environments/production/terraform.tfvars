# Production Environment Configuration
# Copy this file and fill in the sensitive values

environment = "production"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# Database (larger instance for production)
db_instance_class = "db.t3.small"
db_name           = "mobigen"
db_username       = "mobigen_admin"

# Redis (larger instance for production)
redis_node_type = "cache.t3.small"

# ECS Task Sizing (production-ready)
web_cpu          = 512
web_memory       = 1024
generator_cpu    = 1024
generator_memory = 2048
builder_cpu      = 512
builder_memory   = 1024

# HTTPS (required for production - provide ACM certificate ARN)
certificate_arn = ""  # arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID

# Application Settings
nextauth_url = "https://mobigen.example.com"
