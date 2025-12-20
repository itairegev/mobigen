output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB zone ID for Route53"
  value       = aws_lb.main.zone_id
}

output "web_target_group_arn" {
  description = "Web target group ARN"
  value       = aws_lb_target_group.web.arn
}

output "generator_target_group_arn" {
  description = "Generator target group ARN"
  value       = aws_lb_target_group.generator.arn
}

output "security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "HTTPS listener ARN (if certificate provided)"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}
