# -----------------------------------------------------------------------------
# 1. NETWORK (VPC)
# -----------------------------------------------------------------------------

resource "aws_vpc" "app_vpc" {
  cidr_block             = var.vpc_cidr
  enable_dns_support     = true
  enable_dns_hostnames   = true

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
  count             = length(var.public_subnet_cidrs)
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.public_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true # Public subnets need public IPs

  tags = {
    Name = "actserv-public-subnet-${count.index}"
  }
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  # Private subnets do not need public IPs

  tags = {
    Name = "actserv-private-subnet-${count.index}"
  }
}

# -----------------------------------------------------------------------------
# 2. RDS DATABASE (PostgreSQL)
# -----------------------------------------------------------------------------

resource "aws_db_subnet_group" "default" {
  name       = "actserv-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "ActServ DB Subnet Group"
  }
}

# Security Group for the DB (Allows application containers to talk to the DB)
resource "aws_security_group" "db_access" {
  name        = "actserv-db-access"
  description = "Allow inbound traffic from app services"
  vpc_id      = aws_vpc.app_vpc.id

  # NOTE: Ingress rule for DB port 5432 is added later via aws_security_group_rule
  # to specifically allow traffic from the ECS Security Group only.

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
  allocated_storage      = var.db_allocated_storage
  storage_type           = "gp2"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = var.db_instance_class
  identifier             = "actserv-database"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.default.name
  skip_final_snapshot    = true
  publicly_accessible    = false

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
  domain     = "vpc"
  depends_on = [aws_internet_gateway.igw]

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
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gateway.id
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
    target_origin_id       = "S3-React-Origin"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
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
# 5. BACKEND: IAM, ECR, ECS FARGATE
# -----------------------------------------------------------------------------

# Data source for current AWS region (used in CloudWatch logs)
data "aws_region" "current" {}

## 5.1 IAM ROLES

# IAM Role for ECS Task Execution (Allows ECS to pull images, log to CloudWatch)
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "actserv-ecs-execution-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# Attach standard Amazon-managed policy for execution permissions
resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Role for ECS Task (Application Role - Grants permissions to Django code)
resource "aws_iam_role" "ecs_task_role" {
  name               = "actserv-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

## 5.2 ECR AND SECURITY GROUPS

# Container Registry for Django Image
resource "aws_ecr_repository" "django_repo" {
  name                 = "actserv-django-repo"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "actserv-django-repo"
  }
}

# Security Group for the Application Load Balancer (ALB)
resource "aws_security_group" "alb_sg" {
  name        = "actserv-alb-sg"
  description = "Allow inbound HTTP/S and outbound to ECS tasks"
  vpc_id      = aws_vpc.app_vpc.id

  # Ingress: Allow HTTP from everywhere
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Ingress: Allow HTTPS from everywhere
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Egress: Allow all outbound traffic (ALB needs to talk to the ECS tasks)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "actserv-alb-sg"
  }
}

# Security Group for the ECS Fargate Tasks
resource "aws_security_group" "ecs_sg" {
  name        = "actserv-ecs-sg"
  description = "Allows traffic from ALB and outbound to DB/Internet"
  vpc_id      = aws_vpc.app_vpc.id

  # Ingress: Allow traffic on the Django port (e.g., 8000) only from the ALB
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id] # Source is the ALB's SG
  }

  # Egress: Allow outbound traffic to the Internet (via NAT GW)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "actserv-ecs-sg"
  }
}

# Add ingress rule to DB SG, allowing traffic ONLY from the ECS SG.
resource "aws_security_group_rule" "db_ingress_from_ecs" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.ecs_sg.id
  security_group_id        = aws_security_group.db_access.id
  description              = "Allow PostgreSQL access from ECS Tasks"
}

## 5.3 LOAD BALANCER (ALB)

# Application Load Balancer - COMMENTED OUT DUE TO ACCOUNT LIMIT ERROR
/*
resource "aws_lb" "django_alb" {
  name               = "actserv-django-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "actserv-django-alb"
  }
}
*/

# Target Group to route traffic to the ECS Tasks
resource "aws_lb_target_group" "django_tg" {
  name                 = "actserv-django-tg"
  port                 = 8000 # The port your Django app listens on
  protocol             = "HTTP"
  vpc_id               = aws_vpc.app_vpc.id
  target_type          = "ip"

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
}

# Listener to accept traffic on port 80 and forward to the Target Group - COMMENTED OUT
/*
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.django_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.django_tg.arn
  }
}
*/

# output "backend_api_url" { - COMMENTED OUT
#   description = "The public DNS name for the Django API (ALB)."
#   value       = aws_lb.django_alb.dns_name
# }


## 5.4 ECS CLUSTER AND SERVICE

# CloudWatch Log Group for ECS logs
resource "aws_cloudwatch_log_group" "django_logs" {
  name              = "/ecs/actserv-django"
  retention_in_days = 7
}

# ECS Cluster
resource "aws_ecs_cluster" "django_cluster" {
  name = "actserv-django-cluster"
  tags = {
    Name = "actserv-django-cluster"
  }
}

# ECS Task Definition (The blueprint for your Django container)
resource "aws_ecs_task_definition" "django_task" {
  family                   = "actserv-django-task"
  cpu                      = "256"
  memory                   = "512"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "django-backend"
      image     = aws_ecr_repository.django_repo.repository_url
      cpu       = 256
      memory    = 512
      essential = true
      portMappings = [
        {
          containerPort = 8000
          hostPort      = 8000
        }
      ]
      environment = [
        # CRITICAL: INJECTING RDS CONNECTION DETAILS
        { name = "DB_HOST", value = aws_db_instance.postgres.address },
        { name = "DB_USER", value = aws_db_instance.postgres.username },
        { name = "DB_NAME", value = var.db_name },
        # NOTE: DB_PASSWORD should be retrieved securely via SSM Parameter or Secrets Manager.
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.django_logs.name
          awslogs-region        = data.aws_region.current.name
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}


# ECS Service (Runs and manages the desired number of tasks)
resource "aws_ecs_service" "django_service" {
  name            = "actserv-django-service"
  cluster         = aws_ecs_cluster.django_cluster.id
  task_definition = aws_ecs_task_definition.django_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    security_groups  = [aws_security_group.ecs_sg.id]
    subnets          = aws_subnet.private[*].id # CRITICAL: Must be in private subnets
    assign_public_ip = false
  }
/*
  load_balancer {
    target_group_arn = aws_lb_target_group.django_tg.arn
    container_name   = "django-backend"
    container_port   = 8000
  }
*/

  # Dependencies adjusted: Removed aws_lb_listener.http_listener
  depends_on = [
    aws_cloudwatch_log_group.django_logs, # Ensure logs exist before task starts
    aws_security_group_rule.db_ingress_from_ecs, # Ensure DB access is configured
    aws_lb_target_group.django_tg, # Ensure target group is created
  ]
}