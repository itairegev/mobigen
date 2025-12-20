# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# ALB Outputs
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB for Route53"
  value       = module.alb.alb_zone_id
}

# ECR Outputs
output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS port"
  value       = module.rds.port
}

# ElastiCache Outputs
output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.endpoint
}

output "redis_port" {
  description = "Redis port"
  value       = module.elasticache.port
}

# S3 Outputs
output "artifacts_bucket" {
  description = "S3 bucket for build artifacts"
  value       = module.s3.artifacts_bucket_name
}

output "templates_bucket" {
  description = "S3 bucket for templates"
  value       = module.s3.templates_bucket_name
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "web_service_name" {
  description = "Web service name"
  value       = module.ecs.web_service_name
}

output "generator_service_name" {
  description = "Generator service name"
  value       = module.ecs.generator_service_name
}

output "builder_service_name" {
  description = "Builder service name"
  value       = module.ecs.builder_service_name
}

# Quick Start URLs
output "application_url" {
  description = "Application URL (ALB DNS)"
  value       = "http://${module.alb.alb_dns_name}"
}

output "generator_url" {
  description = "Generator API URL"
  value       = "http://${module.alb.alb_dns_name}:4000"
}
