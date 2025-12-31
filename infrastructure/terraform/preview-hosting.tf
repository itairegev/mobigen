# Preview Hosting Infrastructure
#
# S3 bucket for hosting web preview exports with CloudFront CDN
# Previews auto-expire after 24 hours

variable "preview_bucket_name" {
  description = "Name of the S3 bucket for preview hosting"
  type        = string
  default     = "mobigen-previews"
}

variable "preview_domain" {
  description = "Domain for preview URLs"
  type        = string
  default     = "preview.mobigen.io"
}

variable "preview_expiry_days" {
  description = "Number of days before preview files are automatically deleted"
  type        = number
  default     = 1
}

# S3 bucket for preview files
resource "aws_s3_bucket" "preview_bucket" {
  bucket = var.preview_bucket_name

  tags = {
    Name        = "Mobigen Preview Hosting"
    Environment = var.environment
    Purpose     = "Web preview hosting for generated apps"
  }
}

# Enable versioning for rollback capability
resource "aws_s3_bucket_versioning" "preview_versioning" {
  bucket = aws_s3_bucket.preview_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle rule to auto-delete expired previews
resource "aws_s3_bucket_lifecycle_configuration" "preview_lifecycle" {
  bucket = aws_s3_bucket.preview_bucket.id

  rule {
    id     = "expire-previews"
    status = "Enabled"

    filter {
      prefix = "" # Apply to all objects
    }

    expiration {
      days = var.preview_expiry_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}

# Public access settings - previews need to be publicly readable
resource "aws_s3_bucket_public_access_block" "preview_public_access" {
  bucket = aws_s3_bucket.preview_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Bucket policy for public read access
resource "aws_s3_bucket_policy" "preview_policy" {
  bucket = aws_s3_bucket.preview_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.preview_bucket.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.preview_public_access]
}

# Enable static website hosting
resource "aws_s3_bucket_website_configuration" "preview_website" {
  bucket = aws_s3_bucket.preview_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html" # For SPA routing
  }
}

# CORS configuration for API access
resource "aws_s3_bucket_cors_configuration" "preview_cors" {
  bucket = aws_s3_bucket.preview_bucket.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "preview_oai" {
  comment = "OAI for Mobigen preview hosting"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "preview_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "Mobigen Preview CDN"
  price_class         = "PriceClass_100" # US, Canada, Europe only for cost savings

  aliases = var.preview_domain != "" ? [var.preview_domain] : []

  origin {
    domain_name = aws_s3_bucket.preview_bucket.bucket_regional_domain_name
    origin_id   = "S3-${var.preview_bucket_name}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.preview_oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.preview_bucket_name}"
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600  # 1 hour
    max_ttl     = 86400 # 1 day
  }

  # Cache behavior for HTML files (no cache)
  ordered_cache_behavior {
    path_pattern     = "*.html"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.preview_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    viewer_protocol_policy = "redirect-to-https"
  }

  # Custom error response for SPA routing
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = var.preview_domain == ""
    # Use ACM certificate if custom domain is set
    # acm_certificate_arn      = var.preview_domain != "" ? aws_acm_certificate.preview_cert[0].arn : null
    # ssl_support_method       = var.preview_domain != "" ? "sni-only" : null
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "Mobigen Preview CDN"
    Environment = var.environment
  }
}

# IAM policy for preview service to upload to S3
resource "aws_iam_policy" "preview_upload_policy" {
  name        = "mobigen-preview-upload"
  description = "Allow preview service to upload to preview bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.preview_bucket.arn,
          "${aws_s3_bucket.preview_bucket.arn}/*"
        ]
      }
    ]
  })
}

# Outputs
output "preview_bucket_name" {
  description = "Name of the preview S3 bucket"
  value       = aws_s3_bucket.preview_bucket.id
}

output "preview_bucket_arn" {
  description = "ARN of the preview S3 bucket"
  value       = aws_s3_bucket.preview_bucket.arn
}

output "preview_website_endpoint" {
  description = "S3 website endpoint for previews"
  value       = aws_s3_bucket_website_configuration.preview_website.website_endpoint
}

output "preview_cloudfront_domain" {
  description = "CloudFront domain for previews"
  value       = aws_cloudfront_distribution.preview_cdn.domain_name
}

output "preview_cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.preview_cdn.id
}
