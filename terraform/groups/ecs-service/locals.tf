# Define all hardcoded local variable and local variables looked up from data resources
locals {
  stack_name                = "company-requests" # this must match the stack name the service deploys into
  name_prefix               = "${local.stack_name}-${var.environment}"
  service_name              = "account-validator-web"
  container_port            = "3000" # default node port required here until prod docker container is built allowing port change via env var
  docker_repo               = "account-validator-web"
  lb_listener_rule_priority = 13
  lb_listener_paths         = ["/xbrl_validate"]
  healthcheck_path          = "/xbrl_validate/healthcheck" #healthcheck path for account-validator-web
  healthcheck_matcher       = "200"           # no explicit healthcheck in this service yet, change this when added!

  kms_alias       = "alias/${var.aws_profile}/environment-services-kms"
  service_secrets = jsondecode(data.vault_generic_secret.service_secrets.data_json)

  parameter_store_secrets = {
    "vpc_name"              = local.service_secrets["vpc_name"]
    "chs_api_key"           = local.service_secrets["chs_api_key"]
    "chs_internal_api_key"  = local.service_secrets["chs_internal_api_key"]
    "internal_api_url"      = local.service_secrets["internal_api_url"]
    "account_test_url"      = local.service_secrets["account_test_url"]
    "account_url"           = local.service_secrets["account_url"]
    "cache_server"          = local.service_secrets["cache_server"]
    "cookie_secret"         = local.service_secrets["cookie_secret"]
    "file_transfer_api_key" = local.service_secrets["file_transfer_api_key"]
  }

  vpc_name              = local.service_secrets["vpc_name"]
  chs_api_key           = local.service_secrets["chs_api_key"]
  chs_internal_api_key  = local.service_secrets["chs_internal_api_key"]
  internal_api_url      = local.service_secrets["internal_api_url"]
  cdn_host              = local.service_secrets["cdn_host"]
  account_test_url      = local.service_secrets["account_test_url"]
  account_url           = local.service_secrets["account_url"]
  cache_server          = local.service_secrets["cache_server"]
  cookie_secret         = local.service_secrets["cookie_secret"]
  file_transfer_api_key = local.service_secrets["file_transfer_api_key"]

  # create a map of secret name => secret arn to pass into ecs service module
  # using the trimprefix function to remove the prefixed path from the secret name
  secrets_arn_map = {
    for sec in data.aws_ssm_parameter.secret :
    trimprefix(sec.name, "/${local.name_prefix}/") => sec.arn
  }

  service_secrets_arn_map = {
    for sec in module.secrets.secrets :
    trimprefix(sec.name, "/${local.service_name}-${var.environment}/") => sec.arn
  }

  task_secrets = [
    { "name" : "COOKIE_SECRET", "valueFrom" : "${local.secrets_arn_map.web-oauth2-cookie-secret}" },
    { "name" : "CHS_API_KEY", "valueFrom" : "${local.service_secrets_arn_map.chs_api_key}" },
    { "name" : "CHS_INTERNAL_API_KEY", "value" : "${local.service_secrets_arn_map..chs_internal_api_key}" },
    { "name" : "CACHE_SERVER", "valueFrom" : "${local.service_secrets_arn_map.cache_server}" },
    { "name" : "ACCOUNT_URL", "valueFrom" : "${local.service_secrets_arn_map.account_url}" },
    { "name" : "ACCOUNT_TEST_URL", "valueFrom" : "${local.service_secrets_arn_map.account_test_url}" },
    { "name" : "INTERNAL_API_URL", "valueFrom" : "${local.service_secrets_arn_map.internal_api_url}" },
    { "name" : "FILE_TRANSFER_API_KEY", "valueFrom" : "${local.service_secrets_arn_map.file_transfer_api_key}" }
  ]

  task_environment = [
    { "name" : "ACCOUNT_WEB_URL", "value" : "${var.account_web_url}" },
    { "name" : "ALLOWED_COMPANY_PREFIXES", "value" : "${var.allowed_company_prefixes}" },
    { "name" : "API_URL", "value" : "${var.api_url}" },
    { "name" : "ACCOUNT_VALIDATOR_MAX_FILE_SIZE", "value" : "${var.account_validator_max_file_size}" },
    { "name" : "ACCOUNT_VALIDATOR_WEB_VERSION", "value" : "${var.account_validator_web_version}" },
    { "name" : "CACHE_SERVER", "value" : "${var.cache_server}" },
    { "name" : "CDN_HOST", "value" : "${var.cdn_host}" },
    { "name" : "CHS_URL", "value" : "${var.chs_url}" },
    { "name" : "COOKIE_SECRET", "value" : "${var.cookie_secret}" },
    { "name" : "COOKIE_DOMAIN", "value" : "${var.cookie_domain}" },
    { "name" : "COOKIE_NAME", "value" : "${var.cookie_name}" },
    { "name" : "EWF_URL", "value" : "${var.ewf_url}" },
    { "name" : "FILE_TRANSFER_API_URL", "value" : "${var.file_transfer_api_url}" },
    { "name" : "KAFKA_BROKER_ADDR", "value" : "${var.kafka_broker_addr}" },
    { "name" : "LOG_LEVEL", "value" : "${var.log_level}" },
    { "name" : "PIWIK_SITE_ID", "value" : "${var.piwik_site_id}" },
    { "name" : "PIWIK_URL", "value" : "${var.piwik_url}" },
    { "name" : "SUPPORTED_MIME_TYPES", "value" : "${var.supported_mime_types}" },
    { "name" : "NODE_ENV", "value" : "${var.node_env}" },
    { "name" : "TZ", "value" : "${var.tz}" },
    { "name" : "UI_UPDATE_INTERVAL_SECONDS", "value" : "${var.ui_update_interval_seconds}" }
  ]

}
