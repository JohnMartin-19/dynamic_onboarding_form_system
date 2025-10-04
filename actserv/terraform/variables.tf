# AWS Region (Should match the region in main.tf)
variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "us-east-1"
}

# ---------------------------------
# Network Variables
# ---------------------------------
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}


# ---------------------------------
# RDS Database Variables
# ---------------------------------
variable "db_instance_class" {
  description = "The instance type for the RDS database."
  type        = string
  default     = "db.t3.micro" # Cost-effective for development
}

variable "db_allocated_storage" {
  description = "The allocated storage in GB for the RDS instance."
  type        = number
  default     = 20
}

# Use the credentials from your local .env for the RDS master user
variable "db_username" {
  description = "Master username for the RDS database."
  type        = string
  default     = "mburu" # Matches POSTGRES_DB_USER
}

variable "db_password" {
  description = "Master password for the RDS database."
  type        = string
  default     = "aVeryStrongPasswordHere" 
  sensitive   = true
}

variable "db_name" {
  description = "Initial database name to create."
  type        = string
  default     = "actserv" # Matches POSTGRES_DB_NAME
}

# ---------------------------------
# EC2 Key Pair Variable (NEW)
# ---------------------------------
variable "public_key_content" {
  description = "The SSH Public Key content used to access the EC2 instance."
  type        = string
  
}