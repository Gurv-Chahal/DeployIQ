#!/usr/bin/env bash

set -euo pipefail

DEPLOYIQ_DEPLOY_ROOT="${DEPLOYIQ_DEPLOY_ROOT:-/opt/deployiq}"
DEPLOYIQ_LOCAL_PORT="${DEPLOYIQ_LOCAL_PORT:-3001}"
DEPLOYIQ_ENV_SOURCE_FILE="${DEPLOYIQ_ENV_SOURCE_FILE:-${DEPLOYIQ_DEPLOY_ROOT}/shared/deployiq.env}"

check() {
  local status="$1"
  local message="$2"
  printf '[%s] %s\n' "${status}" "${message}"
}

if ! command -v uname >/dev/null 2>&1; then
  check FAIL "uname is not available."
  exit 1
fi

ARCH="$(uname -m)"
check INFO "Architecture: ${ARCH}"

if command -v docker >/dev/null 2>&1; then
  check PASS "Docker is installed."
else
  check FAIL "Docker is not installed."
fi

if docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; then
  check PASS "Docker Compose is available."
else
  check FAIL "Docker Compose is not available."
fi

if command -v aws >/dev/null 2>&1; then
  check PASS "AWS CLI is installed."
else
  check FAIL "AWS CLI is not installed."
fi

if systemctl is-active amazon-ssm-agent >/dev/null 2>&1; then
  check PASS "amazon-ssm-agent is active."
else
  check WARN "amazon-ssm-agent is not active via systemctl."
fi

if command -v free >/dev/null 2>&1; then
  FREE_MB="$(free -m | awk '/Mem:/ {print $7}')"
  check INFO "Approximate free memory: ${FREE_MB} MB"
  if [ "${FREE_MB}" -ge 2048 ]; then
    check PASS "Memory headroom meets the 2 GB target."
  else
    check WARN "Memory headroom is below the 2 GB target."
  fi
else
  check WARN "free is not available; skipping memory check."
fi

AVAILABLE_GB="$(df -Pk "${DEPLOYIQ_DEPLOY_ROOT%/*}" 2>/dev/null | awk 'NR==2 {printf "%.1f", $4 / 1024 / 1024}')"
if [ -n "${AVAILABLE_GB:-}" ]; then
  check INFO "Approximate free disk near ${DEPLOYIQ_DEPLOY_ROOT}: ${AVAILABLE_GB} GB"
  awk "BEGIN { exit !(${AVAILABLE_GB} >= 15) }" && check PASS "Disk headroom meets the 15 GB target." || check WARN "Disk headroom is below the 15 GB target."
else
  check WARN "Could not determine free disk space."
fi

if command -v ss >/dev/null 2>&1; then
  if ss -ltn | awk '{print $4}' | grep -q ":${DEPLOYIQ_LOCAL_PORT}\$"; then
    check WARN "Port ${DEPLOYIQ_LOCAL_PORT} is already in use."
  else
    check PASS "Port ${DEPLOYIQ_LOCAL_PORT} is free."
  fi
else
  check WARN "ss is not available; skipping port check."
fi

if systemctl is-active nginx >/dev/null 2>&1; then
  check PASS "nginx is active."
elif systemctl is-active caddy >/dev/null 2>&1; then
  check PASS "caddy is active."
else
  check WARN "No active nginx or caddy service detected."
fi

if [ -f "${DEPLOYIQ_ENV_SOURCE_FILE}" ]; then
  check PASS "Found app env file at ${DEPLOYIQ_ENV_SOURCE_FILE}."
else
  check WARN "App env file not found at ${DEPLOYIQ_ENV_SOURCE_FILE}."
fi
