# Secrets Management for ECS Services

# NextAuth Secret
resource "aws_secretsmanager_secret" "nextauth" {
  name                    = "${var.name_prefix}-nextauth-secret"
  recovery_window_in_days = 0

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "nextauth" {
  secret_id = aws_secretsmanager_secret.nextauth.id
  secret_string = jsonencode({
    secret = var.nextauth_secret
  })
}

# Anthropic API Key
resource "aws_secretsmanager_secret" "anthropic" {
  name                    = "${var.name_prefix}-anthropic-key"
  recovery_window_in_days = 0

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "anthropic" {
  secret_id = aws_secretsmanager_secret.anthropic.id
  secret_string = jsonencode({
    apiKey = var.anthropic_api_key
  })
}

# Expo Token
resource "aws_secretsmanager_secret" "expo" {
  count = var.expo_token != "" ? 1 : 0

  name                    = "${var.name_prefix}-expo-token"
  recovery_window_in_days = 0

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "expo" {
  count = var.expo_token != "" ? 1 : 0

  secret_id = aws_secretsmanager_secret.expo[0].id
  secret_string = jsonencode({
    token = var.expo_token
  })
}

# Database URL Secret (managed externally by RDS module, reference here)
resource "aws_secretsmanager_secret" "database" {
  name                    = "${var.name_prefix}-database-url"
  recovery_window_in_days = 0

  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "database" {
  secret_id = aws_secretsmanager_secret.database.id
  secret_string = jsonencode({
    connectionString = var.database_url
  })
}

# Local values for secret ARNs
locals {
  database_url_secret_arn = aws_secretsmanager_secret.database.arn
  nextauth_secret_arn     = aws_secretsmanager_secret.nextauth.arn
  anthropic_api_key_arn   = aws_secretsmanager_secret.anthropic.arn
  expo_token_arn          = var.expo_token != "" ? aws_secretsmanager_secret.expo[0].arn : ""
}
