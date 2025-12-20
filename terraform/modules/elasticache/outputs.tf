output "endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

output "connection_string" {
  description = "Redis connection string"
  value       = "redis://${aws_elasticache_cluster.main.cache_nodes[0].address}:${aws_elasticache_cluster.main.cache_nodes[0].port}"
}

output "security_group_id" {
  description = "Security group ID for Redis"
  value       = aws_security_group.redis.id
}

output "cluster_id" {
  description = "ElastiCache cluster ID"
  value       = aws_elasticache_cluster.main.cluster_id
}
