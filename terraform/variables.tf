# General Configuration
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  default     = "staging"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "mobigen"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "mobigen_admin"
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# ALB Configuration
variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS (optional for staging)"
  type        = string
  default     = ""
}

# ECS Task Configuration
variable "web_cpu" {
  description = "CPU units for web service (1 vCPU = 1024)"
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Memory for web service in MB"
  type        = number
  default     = 512
}

variable "generator_cpu" {
  description = "CPU units for generator service"
  type        = number
  default     = 512
}

variable "generator_memory" {
  description = "Memory for generator service in MB"
  type        = number
  default     = 1024
}

variable "builder_cpu" {
  description = "CPU units for builder service"
  type        = number
  default     = 256
}

variable "builder_memory" {
  description = "Memory for builder service in MB"
  type        = number
  default     = 512
}

# Application Secrets (set via environment or tfvars)
variable "nextauth_secret" {
  description = "NextAuth.js secret key"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth.js URL (e.g., https://mobigen.example.com)"
  type        = string
  default     = "http://localhost:3000"
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude"
  type        = string
  sensitive   = true
}

variable "expo_token" {
  description = "Expo access token for EAS builds"
  type        = string
  sensitive   = true
  default     = ""
}
