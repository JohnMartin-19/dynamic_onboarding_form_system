
output "database_endpoint" {
  description = "The hostname and port for the RDS instance."
  value       = aws_db_instance.postgres.endpoint
}

output "database_username" {
  description = "The master username for the RDS instance."
  value       = aws_db_instance.postgres.username
}

output "vpc_id" {
  description = "The ID of the VPC."
  value       = aws_vpc.app_vpc.id
}