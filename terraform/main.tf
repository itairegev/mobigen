terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Comment out for initial setup, then configure after creating the S3 bucket
  # backend "s3" {
  #   bucket         = "mobigen-terraform-state"
  #   key            = "state/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "mobigen-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Mobigen"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  name_prefix = "mobigen-${var.environment}"
  common_tags = {
    Project     = "Mobigen"
    Environment = var.environment
  }
}

# ECS Security Group (created first to avoid circular dependency)
resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-tasks-sg"
  })
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  common_tags        = local.common_tags
}

# ECR Repositories
module "ecr" {
  source = "./modules/ecr"

  name_prefix = local.name_prefix
  services    = ["web", "generator", "builder"]
  common_tags = local.common_tags
}

# S3 Storage
module "s3" {
  source = "./modules/s3"

  name_prefix   = local.name_prefix
  random_suffix = random_id.suffix.hex
  common_tags   = local.common_tags
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  db_instance_class     = var.db_instance_class
  db_name               = var.db_name
  db_username           = var.db_username
  ecs_security_group_id = aws_security_group.ecs_tasks.id
  common_tags           = local.common_tags
}

# ElastiCache Redis
module "elasticache" {
  source = "./modules/elasticache"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  node_type             = var.redis_node_type
  ecs_security_group_id = aws_security_group.ecs_tasks.id
  common_tags           = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = var.certificate_arn
  common_tags       = local.common_tags
}

# ECS Fargate Cluster and Services
module "ecs" {
  source = "./modules/ecs"

  name_prefix        = local.name_prefix
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  # ALB target groups
  web_target_group_arn       = module.alb.web_target_group_arn
  generator_target_group_arn = module.alb.generator_target_group_arn
  alb_security_group_id      = module.alb.security_group_id

  # Pre-created security group
  ecs_security_group_id = aws_security_group.ecs_tasks.id

  # ECR repositories
  web_repository_url       = module.ecr.repository_urls["web"]
  generator_repository_url = module.ecr.repository_urls["generator"]
  builder_repository_url   = module.ecr.repository_urls["builder"]

  # Database and cache
  database_url = module.rds.connection_string
  redis_url    = module.elasticache.connection_string

  # S3 buckets
  artifacts_bucket = module.s3.artifacts_bucket_name
  templates_bucket = module.s3.templates_bucket_name

  # Environment variables
  nextauth_secret   = var.nextauth_secret
  nextauth_url      = var.nextauth_url
  anthropic_api_key = var.anthropic_api_key
  expo_token        = var.expo_token

  # Task sizing
  web_cpu          = var.web_cpu
  web_memory       = var.web_memory
  generator_cpu    = var.generator_cpu
  generator_memory = var.generator_memory
  builder_cpu      = var.builder_cpu
  builder_memory   = var.builder_memory

  common_tags = local.common_tags
}

# Update ECS security group with ALB ingress rules
resource "aws_security_group_rule" "ecs_web_from_alb" {
  type                     = "ingress"
  from_port                = 3000
  to_port                  = 3000
  protocol                 = "tcp"
  source_security_group_id = module.alb.security_group_id
  security_group_id        = aws_security_group.ecs_tasks.id
  description              = "Web from ALB"
}

resource "aws_security_group_rule" "ecs_generator_from_alb" {
  type                     = "ingress"
  from_port                = 4000
  to_port                  = 4000
  protocol                 = "tcp"
  source_security_group_id = module.alb.security_group_id
  security_group_id        = aws_security_group.ecs_tasks.id
  description              = "Generator from ALB"
}

resource "aws_security_group_rule" "ecs_builder_from_alb" {
  type                     = "ingress"
  from_port                = 5000
  to_port                  = 5000
  protocol                 = "tcp"
  source_security_group_id = module.alb.security_group_id
  security_group_id        = aws_security_group.ecs_tasks.id
  description              = "Builder from ALB"
}
