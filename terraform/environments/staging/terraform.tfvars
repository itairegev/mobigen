# Staging Environment Configuration
# Copy this file and fill in the sensitive values

environment = "staging"
aws_region  = "us-east-1"

# VPC
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# Database
db_instance_class = "db.t3.micro"
db_name           = "mobigen"
db_username       = "mobigen_admin"

# Redis
redis_node_type = "cache.t3.micro"

# ECS Task Sizing (minimal for staging)
web_cpu          = 256
web_memory       = 512
generator_cpu    = 512
generator_memory = 1024
builder_cpu      = 256
builder_memory   = 512

# HTTPS (leave empty for HTTP-only staging)
certificate_arn = ""

# Application Settings
nextauth_url = "http://localhost:3000"  # Update with ALB URL after deployment
