#!/usr/bin/env bash

set -euo pipefail

: "${APP_REGION:?APP_REGION is required}"
: "${DEPLOYIQ_IMAGE_URI:?DEPLOYIQ_IMAGE_URI is required}"
: "${DEPLOYIQ_IMAGE_TAG:?DEPLOYIQ_IMAGE_TAG is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/lib.sh
source "${SCRIPT_DIR}/lib.sh"

ensure_layout
record_previous_image "${DEPLOYIQ_IMAGE_URI}"
write_runtime_env "${DEPLOYIQ_IMAGE_URI}"
ecr_login

compose pull
compose up -d --remove-orphans
wait_for_healthcheck
record_current_image "${DEPLOYIQ_IMAGE_URI}"

echo "DeployIQ ${DEPLOYIQ_IMAGE_TAG} is healthy on ${DEPLOYIQ_HEALTHCHECK_URL}"
