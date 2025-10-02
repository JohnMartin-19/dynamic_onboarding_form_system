# -----------------------------------------------------------------------------
# TERRAFORM BLOCK (Backend Configuration)
# This configures where Terraform stores its state file (.tfstate).
# We use S3 for storage and DynamoDB for state locking.
# -----------------------------------------------------------------------------
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Use a stable, recent version
    }
  }

  backend "s3" {
    # CHANGE THESE TO UNIQUE NAMES
    bucket         = "actserv-terraform-state" 
    key            = "dynamic-forms/terraform.tfstate"
    region         = "us-east-1" 
    encrypt        = true
    dynamodb_table = "actserv-terraform-locks" # Must match DynamoDB resource name below
  }
}

# -----------------------------------------------------------------------------
# PROVIDER BLOCK
# This configures the AWS provider settings.
# -----------------------------------------------------------------------------
provider "aws" {
  region = "us-east-1" # Use the same region as the S3 backend
}


# -----------------------------------------------------------------------------
# STATE BACKEND RESOURCES (Run manually first)
# These resources MUST be created manually in AWS before 'terraform init'
# can be run, because the backend depends on them.
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "terraform_state" {
  bucket = "actserv-terraform-state"

  tags = {
    Name = "actserv-terraform-state"
  }
}

# Enable versioning for state file protection
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 2. DynamoDB Table for State Locking
# NOTE: The table name MUST match the 'dynamodb_table' value in the backend block above.
resource "aws_dynamodb_table" "terraform_locks" {
  name           = "actserv-terraform-locks"
  hash_key       = "LockID"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "actserv-terraform-locks"
  }
}