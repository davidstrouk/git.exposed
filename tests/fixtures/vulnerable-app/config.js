// gitleaks:allow — intentionally fake secrets for testing git.exposed scanner
const API_KEY = "AKIAIOSFODNN7EXAMPLE";
const stripe_key = "STRIPE_KEY_PLACEHOLDER_FOR_TESTS"; // gitleaks:allow
const github_token = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef1234";
const slack_webhook = "https://hooks.slack.com/services/T0AAAAAA/B0AAAAAA/aaaaaaaaaaaaaaaaaaaaaaaa"; // gitleaks:allow
module.exports = { API_KEY };
