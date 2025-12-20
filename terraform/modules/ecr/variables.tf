variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "services" {
  description = "List of service names to create repositories for"
  type        = list(string)
  default     = ["web", "generator", "builder"]
}

variable "common_tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
