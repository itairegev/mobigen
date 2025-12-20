# Mobigen IAM Role for EC2/ECS/Local Development
# This role provides access to AWS Bedrock (Claude), S3, DynamoDB, and other required services

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for project storage"
  type        = string
  default     = "mobigen-projects"
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# IAM Role for Mobigen application
resource "aws_iam_role" "mobigen_app" {
  name = "mobigen-app-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Allow EC2 instances to assume this role
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      {
        # Allow ECS tasks to assume this role
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      },
      {
        # Allow Lambda functions to assume this role
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "mobigen-app-${var.environment}"
    Environment = var.environment
    Project     = "mobigen"
  }
}

# ============================================================================
# BEDROCK PERMISSIONS (Claude AI Access)
# ============================================================================
resource "aws_iam_policy" "bedrock_access" {
  name        = "mobigen-bedrock-${var.environment}"
  description = "Allow access to AWS Bedrock for Claude models"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "BedrockInvokeModel"
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          # Claude Sonnet 4
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-sonnet-4-20250514-v1:0",
          # Claude 3.5 Sonnet
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0",
          # Claude 3.5 Haiku
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0",
          # Claude 3 Opus
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-opus-20240229-v1:0",
          # Claude 3 Sonnet
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          # Claude 3 Haiku
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
          # Allow all Claude models (future-proofing)
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-*"
        ]
      },
      {
        Sid    = "BedrockListModels"
        Effect = "Allow"
        Action = [
          "bedrock:ListFoundationModels",
          "bedrock:GetFoundationModel"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================================================
# S3 PERMISSIONS (Project Storage, Builds, Screenshots)
# ============================================================================
resource "aws_iam_policy" "s3_access" {
  name        = "mobigen-s3-${var.environment}"
  description = "Allow access to S3 for project storage"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "S3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}-${var.environment}"
        ]
      },
      {
        Sid    = "S3ObjectAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion",
          "s3:ListMultipartUploadParts",
          "s3:AbortMultipartUpload"
        ]
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}/*",
          "arn:aws:s3:::${var.s3_bucket_name}-${var.environment}/*"
        ]
      }
    ]
  })
}

# ============================================================================
# DYNAMODB PERMISSIONS (Customer App Databases)
# ============================================================================
resource "aws_iam_policy" "dynamodb_access" {
  name        = "mobigen-dynamodb-${var.environment}"
  description = "Allow access to DynamoDB for customer app data"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DynamoDBTableAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/mobigen-*"
        ]
      },
      {
        Sid    = "DynamoDBIndexAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/mobigen-*/index/*"
        ]
      },
      {
        Sid    = "DynamoDBCreateTable"
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:UpdateTable",
          "dynamodb:ListTables"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/mobigen-*"
        ]
      }
    ]
  })
}

# ============================================================================
# SECRETS MANAGER PERMISSIONS (API Keys, Credentials)
# ============================================================================
resource "aws_iam_policy" "secrets_access" {
  name        = "mobigen-secrets-${var.environment}"
  description = "Allow access to Secrets Manager for API keys and credentials"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "SecretsManagerAccess"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:mobigen/*",
          "arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:mobigen-*"
        ]
      }
    ]
  })
}

# ============================================================================
# CLOUDWATCH LOGS PERMISSIONS (Logging)
# ============================================================================
resource "aws_iam_policy" "cloudwatch_logs" {
  name        = "mobigen-cloudwatch-${var.environment}"
  description = "Allow access to CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogsAccess"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/mobigen/*",
          "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/mobigen/*:*"
        ]
      }
    ]
  })
}

# ============================================================================
# ATTACH POLICIES TO ROLE
# ============================================================================
resource "aws_iam_role_policy_attachment" "bedrock" {
  role       = aws_iam_role.mobigen_app.name
  policy_arn = aws_iam_policy.bedrock_access.arn
}

resource "aws_iam_role_policy_attachment" "s3" {
  role       = aws_iam_role.mobigen_app.name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_role_policy_attachment" "dynamodb" {
  role       = aws_iam_role.mobigen_app.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "secrets" {
  role       = aws_iam_role.mobigen_app.name
  policy_arn = aws_iam_policy.secrets_access.arn
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.mobigen_app.name
  policy_arn = aws_iam_policy.cloudwatch_logs.arn
}

# ============================================================================
# EC2 INSTANCE PROFILE (for EC2 deployment)
# ============================================================================
resource "aws_iam_instance_profile" "mobigen_app" {
  name = "mobigen-app-${var.environment}"
  role = aws_iam_role.mobigen_app.name
}

# ============================================================================
# IAM USER FOR LOCAL DEVELOPMENT (Optional)
# ============================================================================
resource "aws_iam_user" "mobigen_dev" {
  count = var.environment == "dev" ? 1 : 0
  name  = "mobigen-dev-user"

  tags = {
    Name        = "mobigen-dev-user"
    Environment = var.environment
    Project     = "mobigen"
  }
}

resource "aws_iam_user_policy_attachment" "dev_bedrock" {
  count      = var.environment == "dev" ? 1 : 0
  user       = aws_iam_user.mobigen_dev[0].name
  policy_arn = aws_iam_policy.bedrock_access.arn
}

resource "aws_iam_user_policy_attachment" "dev_s3" {
  count      = var.environment == "dev" ? 1 : 0
  user       = aws_iam_user.mobigen_dev[0].name
  policy_arn = aws_iam_policy.s3_access.arn
}

resource "aws_iam_user_policy_attachment" "dev_dynamodb" {
  count      = var.environment == "dev" ? 1 : 0
  user       = aws_iam_user.mobigen_dev[0].name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}

# ============================================================================
# OUTPUTS
# ============================================================================
output "role_arn" {
  description = "ARN of the Mobigen IAM role"
  value       = aws_iam_role.mobigen_app.arn
}

output "role_name" {
  description = "Name of the Mobigen IAM role"
  value       = aws_iam_role.mobigen_app.name
}

output "instance_profile_arn" {
  description = "ARN of the EC2 instance profile"
  value       = aws_iam_instance_profile.mobigen_app.arn
}

output "instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.mobigen_app.name
}

output "dev_user_name" {
  description = "Name of the dev IAM user (if created)"
  value       = var.environment == "dev" ? aws_iam_user.mobigen_dev[0].name : null
}
