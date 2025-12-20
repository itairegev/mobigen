output "repository_urls" {
  description = "Map of service names to ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "repository_arns" {
  description = "Map of service names to ECR repository ARNs"
  value       = { for k, v in aws_ecr_repository.services : k => v.arn }
}

output "registry_id" {
  description = "ECR registry ID"
  value       = data.aws_caller_identity.current.account_id
}

output "registry_url" {
  description = "ECR registry URL"
  value       = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com"
}
