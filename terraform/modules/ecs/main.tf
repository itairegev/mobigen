# ECS Fargate Module

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(var.common_tags, {
    Name = "${var.name_prefix}-cluster"
  })
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Note: Security group is created in main.tf to avoid circular dependencies
# and passed in via var.ecs_security_group_id

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_execution" {
  name = "${var.name_prefix}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Additional policy for Secrets Manager access
resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.name_prefix}-ecs-execution-secrets"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Resource = "*"
    }]
  })
}

# IAM Role for ECS Tasks
resource "aws_iam_role" "ecs_task" {
  name = "${var.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = var.common_tags
}

# Task role policies
resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.name_prefix}-ecs-task-s3"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        "arn:aws:s3:::${var.artifacts_bucket}",
        "arn:aws:s3:::${var.artifacts_bucket}/*",
        "arn:aws:s3:::${var.templates_bucket}",
        "arn:aws:s3:::${var.templates_bucket}/*"
      ]
    }]
  })
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/${var.name_prefix}/web"
  retention_in_days = 14

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "generator" {
  name              = "/ecs/${var.name_prefix}/generator"
  retention_in_days = 14

  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "builder" {
  name              = "/ecs/${var.name_prefix}/builder"
  retention_in_days = 14

  tags = var.common_tags
}

# Task Definition - Web
resource "aws_ecs_task_definition" "web" {
  family                   = "${var.name_prefix}-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "web"
    image = "${var.web_repository_url}:latest"

    portMappings = [{
      containerPort = 3000
      hostPort      = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "NEXTAUTH_URL", value = var.nextauth_url },
      { name = "GENERATOR_URL", value = "http://generator.${var.name_prefix}.local:4000" }
    ]

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.database_url_secret_arn}:connectionString::" },
      { name = "NEXTAUTH_SECRET", valueFrom = "${local.nextauth_secret_arn}:secret::" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.web.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = var.common_tags
}

# Task Definition - Generator
resource "aws_ecs_task_definition" "generator" {
  family                   = "${var.name_prefix}-generator"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.generator_cpu
  memory                   = var.generator_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "generator"
    image = "${var.generator_repository_url}:latest"

    portMappings = [{
      containerPort = 4000
      hostPort      = 4000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "4000" },
      { name = "REDIS_URL", value = var.redis_url },
      { name = "TEMPLATES_BUCKET", value = var.templates_bucket }
    ]

    secrets = [
      { name = "DATABASE_URL", valueFrom = "${local.database_url_secret_arn}:connectionString::" },
      { name = "ANTHROPIC_API_KEY", valueFrom = "${local.anthropic_api_key_arn}:apiKey::" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.generator.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:4000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = var.common_tags
}

# Task Definition - Builder
resource "aws_ecs_task_definition" "builder" {
  family                   = "${var.name_prefix}-builder"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.builder_cpu
  memory                   = var.builder_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = "builder"
    image = "${var.builder_repository_url}:latest"

    portMappings = [{
      containerPort = 5000
      hostPort      = 5000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "5000" },
      { name = "REDIS_URL", value = var.redis_url },
      { name = "ARTIFACTS_BUCKET", value = var.artifacts_bucket }
    ]

    secrets = local.expo_token_arn != "" ? [
      { name = "DATABASE_URL", valueFrom = "${local.database_url_secret_arn}:connectionString::" },
      { name = "EXPO_TOKEN", valueFrom = "${local.expo_token_arn}:token::" }
    ] : [
      { name = "DATABASE_URL", valueFrom = "${local.database_url_secret_arn}:connectionString::" }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.builder.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])

  tags = var.common_tags
}

# ECS Service - Web
resource "aws_ecs_service" "web" {
  name            = "${var.name_prefix}-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.web_target_group_arn
    container_name   = "web"
    container_port   = 3000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  tags = var.common_tags
}

# ECS Service - Generator
resource "aws_ecs_service" "generator" {
  name            = "${var.name_prefix}-generator"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.generator.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = var.generator_target_group_arn
    container_name   = "generator"
    container_port   = 4000
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  tags = var.common_tags
}

# ECS Service - Builder
resource "aws_ecs_service" "builder" {
  name            = "${var.name_prefix}-builder"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.builder.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  tags = var.common_tags
}

data "aws_region" "current" {}
