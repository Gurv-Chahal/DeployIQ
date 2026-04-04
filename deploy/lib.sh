#!/usr/bin/env bash

set -euo pipefail

DEPLOYIQ_DEPLOY_ROOT="${DEPLOYIQ_DEPLOY_ROOT:-/opt/deployiq}"
DEPLOYIQ_DEPLOY_DIR="${DEPLOYIQ_DEPLOY_DIR:-${DEPLOYIQ_DEPLOY_ROOT}/deploy}"
DEPLOYIQ_SHARED_DIR="${DEPLOYIQ_SHARED_DIR:-${DEPLOYIQ_DEPLOY_ROOT}/shared}"
DEPLOYIQ_STATE_DIR="${DEPLOYIQ_STATE_DIR:-${DEPLOYIQ_DEPLOY_ROOT}/state}"
DEPLOYIQ_ENV_SOURCE_FILE="${DEPLOYIQ_ENV_SOURCE_FILE:-${DEPLOYIQ_SHARED_DIR}/deployiq.env}"
DEPLOYIQ_COMPOSE_FILE="${DEPLOYIQ_COMPOSE_FILE:-${DEPLOYIQ_DEPLOY_DIR}/docker-compose.ec2.yml}"
DEPLOYIQ_RUNTIME_ENV_FILE="${DEPLOYIQ_RUNTIME_ENV_FILE:-${DEPLOYIQ_STATE_DIR}/compose.env}"
DEPLOYIQ_PROJECT_NAME="${DEPLOYIQ_PROJECT_NAME:-deployiq}"
DEPLOYIQ_BIND_ADDRESS="${DEPLOYIQ_BIND_ADDRESS:-127.0.0.1}"
DEPLOYIQ_HOST_PORT="${DEPLOYIQ_LOCAL_PORT:-${DEPLOYIQ_HOST_PORT:-3001}}"
DEPLOYIQ_HEALTHCHECK_URL="${DEPLOYIQ_HEALTHCHECK_URL:-http://127.0.0.1:${DEPLOYIQ_HOST_PORT}/api/review}"
DEPLOYIQ_PREVIOUS_IMAGE_FILE="${DEPLOYIQ_PREVIOUS_IMAGE_FILE:-${DEPLOYIQ_STATE_DIR}/previous-image-uri}"
DEPLOYIQ_CURRENT_IMAGE_FILE="${DEPLOYIQ_CURRENT_IMAGE_FILE:-${DEPLOYIQ_STATE_DIR}/current-image-uri}"
CHROMA_IMAGE="${CHROMA_IMAGE:-chromadb/chroma}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_file() {
  if [ ! -f "$1" ]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose -p "${DEPLOYIQ_PROJECT_NAME}" -f "${DEPLOYIQ_COMPOSE_FILE}" "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -p "${DEPLOYIQ_PROJECT_NAME}" -f "${DEPLOYIQ_COMPOSE_FILE}" "$@"
    return
  fi

  echo "Docker Compose is not available on this host." >&2
  exit 1
}

ensure_layout() {
  require_command docker
  require_command aws

  mkdir -p "${DEPLOYIQ_SHARED_DIR}" "${DEPLOYIQ_STATE_DIR}"
  require_file "${DEPLOYIQ_COMPOSE_FILE}"
  require_file "${DEPLOYIQ_ENV_SOURCE_FILE}"

  ln -sfn "${DEPLOYIQ_ENV_SOURCE_FILE}" "${DEPLOYIQ_DEPLOY_DIR}/deployiq.env"
}

current_image_uri() {
  if [ -f "${DEPLOYIQ_CURRENT_IMAGE_FILE}" ]; then
    cat "${DEPLOYIQ_CURRENT_IMAGE_FILE}"
  fi
}

write_runtime_env() {
  local image_uri="$1"

  cat > "${DEPLOYIQ_RUNTIME_ENV_FILE}" <<EOF
DEPLOYIQ_IMAGE_URI=${image_uri}
DEPLOYIQ_BIND_ADDRESS=${DEPLOYIQ_BIND_ADDRESS}
DEPLOYIQ_HOST_PORT=${DEPLOYIQ_HOST_PORT}
CHROMA_IMAGE=${CHROMA_IMAGE}
EOF

  ln -sfn "${DEPLOYIQ_RUNTIME_ENV_FILE}" "${DEPLOYIQ_DEPLOY_DIR}/.env"
}

record_previous_image() {
  local current_uri
  current_uri="$(current_image_uri || true)"

  if [ -n "${current_uri}" ] && [ "${current_uri}" != "$1" ]; then
    printf '%s' "${current_uri}" > "${DEPLOYIQ_PREVIOUS_IMAGE_FILE}"
  fi
}

record_current_image() {
  printf '%s' "$1" > "${DEPLOYIQ_CURRENT_IMAGE_FILE}"
}

ecr_login() {
  local registry
  registry="${DEPLOYIQ_IMAGE_URI%%/*}"

  aws ecr get-login-password --region "${APP_REGION}" | docker login --username AWS --password-stdin "${registry}"
}

wait_for_healthcheck() {
  local attempt=0

  until [ "${attempt}" -ge 30 ]; do
    if command -v curl >/dev/null 2>&1; then
      if curl --fail --silent --show-error "${DEPLOYIQ_HEALTHCHECK_URL}" >/dev/null; then
        return 0
      fi
    elif command -v wget >/dev/null 2>&1; then
      if wget -q -O - "${DEPLOYIQ_HEALTHCHECK_URL}" >/dev/null; then
        return 0
      fi
    else
      echo "Neither curl nor wget is available for health checks." >&2
      exit 1
    fi

    attempt=$((attempt + 1))
    sleep 5
  done

  echo "Health check failed for ${DEPLOYIQ_HEALTHCHECK_URL}" >&2
  compose ps >&2 || true
  exit 1
}
