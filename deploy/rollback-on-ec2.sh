#!/usr/bin/env bash

set -euo pipefail

: "${APP_REGION:?APP_REGION is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/lib.sh
source "${SCRIPT_DIR}/lib.sh"

ROLLBACK_IMAGE_URI="${1:-${ROLLBACK_IMAGE_URI:-}}"

if [ -z "${ROLLBACK_IMAGE_URI}" ] && [ -f "${DEPLOYIQ_PREVIOUS_IMAGE_FILE}" ]; then
  ROLLBACK_IMAGE_URI="$(cat "${DEPLOYIQ_PREVIOUS_IMAGE_FILE}")"
fi

if [ -z "${ROLLBACK_IMAGE_URI}" ]; then
  echo "No rollback image is available. Pass an image URI or deploy once before rolling back." >&2
  exit 1
fi

ensure_layout
export DEPLOYIQ_IMAGE_URI="${ROLLBACK_IMAGE_URI}"
record_previous_image "${ROLLBACK_IMAGE_URI}"
write_runtime_env "${ROLLBACK_IMAGE_URI}"
ecr_login

compose pull
compose up -d --remove-orphans
wait_for_healthcheck
record_current_image "${ROLLBACK_IMAGE_URI}"

echo "Rolled back DeployIQ to ${ROLLBACK_IMAGE_URI}"
