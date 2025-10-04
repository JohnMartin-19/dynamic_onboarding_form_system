# -----------------------------------------------------------------------------
# 1. NETWORK (VPC)
# -----------------------------------------------------------------------------

resource "aws_vpc" "app_vpc" {
  cidr_block              = var.vpc_cidr
  enable_dns_support      = true
  enable_dns_hostnames    = true

  tags = {
    Name = "actserv-vpc"
  }
}

# Data source to fetch available AZs for multi-AZ deployment
data "aws_availability_zones" "available" {
  state = "available"
}

# Define two public and two private subnets across two Availability Zones
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true # Public subnets need public IPs

  tags = {
    Name = "actserv-public-subnet-${count.index}"
  }
}

resource "aws_subnet" "private" {
  count                   = length(var.private_subnet_cidrs)
  vpc_id                  = aws_vpc.app_vpc.id
  cidr_block              = var.private_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  # Private subnets do not need public IPs

  tags = {
    Name = "actserv-private-subnet-${count.index}"
  }
}

# -----------------------------------------------------------------------------
# 2. RDS DATABASE (PostgreSQL)
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "default" {
  name        = "actserv-db-subnet-group"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "ActServ DB Subnet Group"
  }
}

# Security Group for the DB (Allows application to talk to the DB)
resource "aws_security_group" "db_access" {
  name        = "actserv-db-access"
  description = "Allow inbound traffic from app services"
  vpc_id      = aws_vpc.app_vpc.id

  # NOTE: Ingress rule for DB port 5432 is added later via aws_security_group_rule

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "actserv-db-access"
  }
}

resource "aws_db_instance" "postgres" {
  allocated_storage       = var.db_allocated_storage
  storage_type            = "gp2"
  engine                  = "postgres"
  engine_version          = "16"
  instance_class          = var.db_instance_class
  identifier              = "actserv-database"
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.default.name
  skip_final_snapshot     = true
  publicly_accessible     = false

  vpc_security_group_ids = [aws_security_group.db_access.id]
}


# -----------------------------------------------------------------------------
# 3. INTERNET ACCESS & ROUTING
# -----------------------------------------------------------------------------

# 3.1. Internet Gateway (for Public Subnets)
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.app_vpc.id

  tags = {
    Name = "actserv-igw"
  }
}

# 3.2. EIP for NAT Gateway (Must be placed in a Public Subnet)
resource "aws_eip" "nat_gateway_eip" {
  domain      = "vpc"
  depends_on  = [aws_internet_gateway.igw]

  tags = {
    Name = "actserv-nat-eip"
  }
}

# 3.3. NAT Gateway (for Private Subnets to get out to the internet)
resource "aws_nat_gateway" "nat_gateway" {
  allocation_id = aws_eip.nat_gateway_eip.id
  subnet_id     = aws_subnet.public[0].id # Place the NAT GW in the first public subnet

  tags = {
    Name = "actserv-nat-gateway"
  }
}

# 3.4. Public Route Table (Routes 0.0.0.0/0 to IGW)
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.app_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "actserv-public-rt"
  }
}

# 3.5. Private Route Table (Routes 0.0.0.0/0 to NAT Gateway)
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.app_vpc.id

  route {
    cidr_block      = "0.0.0.0/0"
    nat_gateway_id  = aws_nat_gateway.nat_gateway.id
  }

  tags = {
    Name = "actserv-private-rt"
  }
}

# 3.6. Associate Public Subnets with Public Route Table
resource "aws_route_table_association" "public_rt_assoc" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# 3.7. Associate Private Subnets with Private Route Table
resource "aws_route_table_association" "private_rt_assoc" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private_rt.id
}


# -----------------------------------------------------------------------------
# 4. FRONTEND: S3 AND CLOUDFRONT
# -----------------------------------------------------------------------------

# Data source for the current AWS account ID to ensure unique S3 bucket names
data "aws_caller_identity" "current" {}

# 4.1. S3 Bucket for React Static Files
resource "aws_s3_bucket" "frontend" {
  bucket = "actserv-react-frontend-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name = "actserv-frontend-bucket"
  }
}

# 4.2. S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "frontend_versioning" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 4.3. CloudFront Origin Access Identity (OAI)
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for React frontend bucket"
}

# 4.4. S3 Bucket Policy to Grant OAI Read Access
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontRead"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*" # Grant access to objects in the bucket
      },
      {
        Sid       = "AllowCloudFrontList"
        Effect    = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.frontend.arn # Grant access to list the bucket
      }
    ]
  })
}

# 4.5. CloudFront Distribution (CDN) - COMMENTED OUT DUE TO ACCOUNT LIMIT ERROR
/*
resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  default_root_object = "index.html" # Root file for React SPA

  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-React-Origin"
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id         = "S3-React-Origin"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods           = ["GET", "HEAD"]
    compress                 = true
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  price_class = "PriceClass_100"

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name = "actserv-frontend-cdn"
  }
}
*/

# OUTPUT: Frontend URL - COMMENTED OUT
/*
output "frontend_url" {
  description = "The URL for the React application hosted on CloudFront."
  value       = aws_cloudfront_distribution.cdn.domain_name
}
*/


# -----------------------------------------------------------------------------
# 5. BACKEND: IAM, EC2 INSTANCE
# -----------------------------------------------------------------------------

# Data source for current AWS region
data "aws_region" "current" {}

## 5.1 IAM ROLES AND PROFILE (for EC2)

# IAM Role for EC2 Instance (Allows system commands, logging, etc.)
resource "aws_iam_role" "ec2_instance_role" {
  name                = "actserv-ec2-instance-role"
  assume_role_policy  = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

# Attach standard Amazon-managed policy for basic EC2 access and logs (SSM is useful)
resource "aws_iam_role_policy_attachment" "ec2_ssm_policy" {
  role        = aws_iam_role.ec2_instance_role.name
  policy_arn  = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile to attach the role to the EC2 instance
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "actserv-ec2-profile"
  role = aws_iam_role.ec2_instance_role.name
}


## 5.2 EC2 SECURITY GROUP (Replaces ECS/ALB SGs)

# Security Group for the EC2 Instance 
resource "aws_security_group" "ec2_sg" {
  name        = "actserv-ec2-sg"
  description = "Allows SSH, Django app access, and outbound to DB/Internet"
  vpc_id      = aws_vpc.app_vpc.id

  # Ingress: Allow SSH from everywhere (for deployment/debugging)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Ingress: Allow Django app access (Port 8000) from everywhere
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "actserv-ec2-sg"
  }
}

# Add ingress rule to DB SG, allowing traffic ONLY from the new EC2 SG.
# NOTE: This replaces the old 'db_ingress_from_ecs' rule.
resource "aws_security_group_rule" "db_ingress_from_ec2" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ec2_sg.id # Updated reference
  security_group_id        = aws_security_group.db_access.id
  description              = "Allow PostgreSQL access from EC2 Instance"
}

## 5.3 EC2 INSTANCE DEFINITION

# Data source to fetch the latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-kernel-6.1-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Key Pair for SSH access
resource "aws_key_pair" "deployer_key" {
  key_name   = "actserv-deployer-key"
  public_key = var.public_key_content # NOTE: Requires var.public_key_content to be set
}

# EC2 Instance for Django Backend
resource "aws_instance" "django_backend" {
  ami                         = data.aws_ami.amazon_linux.id
  instance_type               = "t3.micro"
  key_name                    = aws_key_pair.deployer_key.key_name
  vpc_security_group_ids      = [aws_security_group.ec2_sg.id]
  subnet_id                   = aws_subnet.public[0].id # Place EC2 in a public subnet
  associate_public_ip_address = true
  iam_instance_profile        = aws_iam_instance_profile.ec2_profile.name

  # User data to install Docker on launch
  user_data = <<-EOF
              #!/bin/bash
              # Install Docker and start service
              sudo yum update -y
              sudo yum install -y docker
              sudo systemctl start docker
              sudo usermod -a -G docker ec2-user
              # The actual deployment (docker pull/run) must be done manually via SSH/SSM after apply.
              EOF

  tags = {
    Name = "actserv-django-backend-ec2"
  }
}

# OUTPUT: Public IP for the EC2 backend
output "backend_api_url" {
    description = "The Public IP address for the Django API (EC2). Access via http://<IP>:8000"
    value       = aws_instance.django_backend.public_ip
}

resource "aws_iam_role_policy_attachment" "ec2_ecr_read_policy" {
  role        = aws_iam_role.ec2_instance_role.name
  policy_arn  = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# -----------------------------------------------------------------------------
# 6. CLEANUP ECS/ALB RESOURCES (DELETING)
# -----------------------------------------------------------------------------

# *** TEMPORARY: Re-add ECR with force_delete to resolve 'RepositoryNotEmptyException' ***
# Terraform will see this resource is in the state and destroy it completely.
resource "aws_ecr_repository" "django_repo" {
  name                 = "actserv-django-repo"
  # CRITICAL: Set force_delete to true to allow destruction of non-empty repository
  force_delete         = true 

  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "actserv-django-repo"
  }
}
/*
  The following resources were either already destroyed or will be destroyed now:
    - aws_ecs_service.django_service
    - aws_ecs_task_definition.django_task
    - aws_ecs_cluster.django_cluster
    - aws_ecr_repository.django_repo (DELETED VIA FORCE_DELETE BLOCK ABOVE)
    - aws_cloudwatch_log_group.django_logs
    - aws_iam_role.ecs_task_execution_role
    - aws_iam_role.ecs_task_role
    - aws_iam_role_policy_attachment.ecs_task_execution_policy
    - aws_security_group.alb_sg (and its rules)
    - aws_security_group.ecs_sg (and its rules, replaced by aws_security_group.ec2_sg)
    - aws_lb.django_alb
    - aws_lb_target_group.django_tg
    - aws_lb_listener.http_listener
    - aws_security_group_rule.db_ingress_from_ecs (replaced by db_ingress_from_ec2)
*/

# COMMENTED OUT OLD ECS/ALB RESOURCES:
/*
# OLD IAM ROLES (ECS)
resource "aws_iam_role" "ecs_task_execution_role" { ... }
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" { ... }
resource "aws_iam_role" "ecs_task_role" { ... }

# OLD ALB SG
resource "aws_security_group" "alb_sg" { ... }

# OLD ECS SG (Replaced by aws_security_group.ec2_sg)
resource "aws_security_group" "ecs_sg" { ... }

# OLD DB RULE (Replaced by db_ingress_from_ec2)
resource "aws_security_group_rule" "db_ingress_from_ecs" { ... }

# OLD ALB RESOURCES
resource "aws_lb" "django_alb" { ... }
resource "aws_lb_target_group" "django_tg" { ... }
resource "aws_lb_listener" "http_listener" { ... }

# OLD CLOUDWATCH/ECS
resource "aws_cloudwatch_log_group" "django_logs" { ... }
resource "aws_ecs_cluster" "django_cluster" { ... }
resource "aws_ecs_task_definition" "django_task" { ... }
resource "aws_ecs_service" "django_service" { ... }
*/