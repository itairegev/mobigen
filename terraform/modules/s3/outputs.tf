output "artifacts_bucket_name" {
  description = "Artifacts bucket name"
  value       = aws_s3_bucket.artifacts.bucket
}

output "artifacts_bucket_arn" {
  description = "Artifacts bucket ARN"
  value       = aws_s3_bucket.artifacts.arn
}

output "templates_bucket_name" {
  description = "Templates bucket name"
  value       = aws_s3_bucket.templates.bucket
}

output "templates_bucket_arn" {
  description = "Templates bucket ARN"
  value       = aws_s3_bucket.templates.arn
}

output "generated_bucket_name" {
  description = "Generated apps bucket name"
  value       = aws_s3_bucket.generated.bucket
}

output "generated_bucket_arn" {
  description = "Generated apps bucket ARN"
  value       = aws_s3_bucket.generated.arn
}

output "s3_access_policy_arn" {
  description = "ARN of S3 access IAM policy"
  value       = aws_iam_policy.s3_access.arn
}
