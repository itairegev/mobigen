variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "random_suffix" {
  description = "Random suffix for unique bucket names"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default     = {}
}
