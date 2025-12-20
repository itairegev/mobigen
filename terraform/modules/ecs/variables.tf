variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

# ALB
variable "web_target_group_arn" {
  description = "Web target group ARN"
  type        = string
}

variable "generator_target_group_arn" {
  description = "Generator target group ARN"
  type        = string
}

variable "alb_security_group_id" {
  description = "ALB security group ID"
  type        = string
}

variable "ecs_security_group_id" {
  description = "Pre-created ECS security group ID"
  type        = string
}

# ECR
variable "web_repository_url" {
  description = "Web ECR repository URL"
  type        = string
}

variable "generator_repository_url" {
  description = "Generator ECR repository URL"
  type        = string
}

variable "builder_repository_url" {
  description = "Builder ECR repository URL"
  type        = string
}

# Database and Cache
variable "database_url" {
  description = "Database connection string"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection string"
  type        = string
}

# S3
variable "artifacts_bucket" {
  description = "S3 bucket for build artifacts"
  type        = string
}

variable "templates_bucket" {
  description = "S3 bucket for templates"
  type        = string
}

# Secrets (ARNs for Secrets Manager)
variable "database_url_secret_arn" {
  description = "ARN of database URL secret"
  type        = string
  default     = ""
}

variable "nextauth_secret_arn" {
  description = "ARN of NextAuth secret"
  type        = string
  default     = ""
}

variable "anthropic_api_key_arn" {
  description = "ARN of Anthropic API key secret"
  type        = string
  default     = ""
}

variable "expo_token_arn" {
  description = "ARN of Expo token secret"
  type        = string
  default     = ""
}

# Application Environment Variables
variable "nextauth_secret" {
  description = "NextAuth.js secret key"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "NextAuth.js URL"
  type        = string
}

variable "anthropic_api_key" {
  description = "Anthropic API key"
  type        = string
  sensitive   = true
}

variable "expo_token" {
  description = "Expo access token"
  type        = string
  sensitive   = true
  default     = ""
}

# Task Sizing
variable "web_cpu" {
  description = "CPU units for web service"
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

variable "common_tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
