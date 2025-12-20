# S3 Storage Module

# Build Artifacts Bucket
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.name_prefix}-artifacts-${var.random_suffix}"

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-artifacts"
    Purpose = "Build artifacts storage"
  })
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "cleanup-old-artifacts"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Templates Bucket
resource "aws_s3_bucket" "templates" {
  bucket = "${var.name_prefix}-templates-${var.random_suffix}"

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-templates"
    Purpose = "App templates storage"
  })
}

resource "aws_s3_bucket_versioning" "templates" {
  bucket = aws_s3_bucket.templates.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "templates" {
  bucket = aws_s3_bucket.templates.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "templates" {
  bucket = aws_s3_bucket.templates.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Generated Apps Bucket (for storing generated project files)
resource "aws_s3_bucket" "generated" {
  bucket = "${var.name_prefix}-generated-${var.random_suffix}"

  tags = merge(var.common_tags, {
    Name    = "${var.name_prefix}-generated"
    Purpose = "Generated app projects storage"
  })
}

resource "aws_s3_bucket_versioning" "generated" {
  bucket = aws_s3_bucket.generated.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "generated" {
  bucket = aws_s3_bucket.generated.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "generated" {
  bucket = aws_s3_bucket.generated.id

  rule {
    id     = "cleanup-old-generated"
    status = "Enabled"

    transition {
      days          = 60
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 180
    }
  }
}

resource "aws_s3_bucket_public_access_block" "generated" {
  bucket = aws_s3_bucket.generated.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Policy for ECS to access S3
resource "aws_iam_policy" "s3_access" {
  name        = "${var.name_prefix}-s3-access"
  description = "Policy for ECS tasks to access S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.artifacts.arn,
          "${aws_s3_bucket.artifacts.arn}/*",
          aws_s3_bucket.templates.arn,
          "${aws_s3_bucket.templates.arn}/*",
          aws_s3_bucket.generated.arn,
          "${aws_s3_bucket.generated.arn}/*"
        ]
      }
    ]
  })

  tags = var.common_tags
}
