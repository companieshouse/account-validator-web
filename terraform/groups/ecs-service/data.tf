data "vault_generic_secret" "stack_secrets" {
  path = "applications/${var.aws_profile}/${var.environment}/${local.stack_name}-stack"
}

data "aws_kms_key" "kms_key" {
  key_id = local.kms_alias
}

data "vault_generic_secret" "service_secrets" {
  path = "applications/${var.aws_profile}/${var.environment}/${local.stack_name}-stack/${local.service_name}"
}
data "aws_vpc" "vpc" {
  filter {
    name   = "tag:Name"
    values = [local.vpc_name]
  }
}
data "aws_subnets" "deployment" {
  filter {
    name   = "tag:Name"
    values = ["${var.account}-mm-platform-routing-eu-west-2*"]
  }
}

data "aws_acm_certificate" "cert" {
  domain = "${var.cert_domain}"
}

data "aws_ecs_cluster" "ecs_cluster" {
  cluster_name = "${local.name_prefix}-cluster"
}

data "aws_iam_role" "ecs_cluster_iam_role" {
  name = "${local.name_prefix}-ecs-task-execution-role"
}

# retrieve all secrets for this stack using the stack path
data "aws_ssm_parameters_by_path" "secrets" {
  path = "/${local.name_prefix}"
}

# create a list of secrets names to retrieve them in a nicer format and lookup each secret by name
data "aws_ssm_parameter" "secret" {
  for_each = toset(data.aws_ssm_parameters_by_path.secrets.names)
  name     = each.key
}
