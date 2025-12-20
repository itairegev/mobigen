output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "web_service_name" {
  description = "Web service name"
  value       = aws_ecs_service.web.name
}

output "web_service_id" {
  description = "Web service ID"
  value       = aws_ecs_service.web.id
}

output "generator_service_name" {
  description = "Generator service name"
  value       = aws_ecs_service.generator.name
}

output "generator_service_id" {
  description = "Generator service ID"
  value       = aws_ecs_service.generator.id
}

output "builder_service_name" {
  description = "Builder service name"
  value       = aws_ecs_service.builder.name
}

output "builder_service_id" {
  description = "Builder service ID"
  value       = aws_ecs_service.builder.id
}

output "ecs_security_group_id" {
  description = "ECS tasks security group ID"
  value       = var.ecs_security_group_id
}

output "execution_role_arn" {
  description = "ECS execution role ARN"
  value       = aws_iam_role.ecs_execution.arn
}

output "task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task.arn
}
