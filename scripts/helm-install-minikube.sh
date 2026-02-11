#!/usr/bin/env bash
# Install or upgrade python-resume in minikube using Helm.
# Usage:
#   ./scripts/helm-install-minikube.sh              # use images from Docker Hub
#   ./scripts/helm-install-minikube.sh --build-load # build locally and load into minikube

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART="${REPO_ROOT}/helm/python-resume"
RELEASE_NAME="${RELEASE_NAME:-python-resume}"
NAMESPACE="${NAMESPACE:-default}"

BUILD_LOAD=false
for arg in "$@"; do
  case "$arg" in
    --build-load) BUILD_LOAD=true ;;
    -h|--help)
      echo "Usage: $0 [--build-load]"
      echo "  --build-load  Build images locally and load into minikube (eval \$(minikube docker-env))"
      exit 0
      ;;
  esac
done

if ! minikube status &>/dev/null; then
  echo "Minikube is not running. Start it with: minikube start"
  exit 1
fi

if [[ "$BUILD_LOAD" == true ]]; then
  echo "Building images and loading into minikube..."
  eval "$(minikube docker-env)"
  docker build -t jondkelley/python_resume:latest "$REPO_ROOT"
  docker build -t jondkelley/pandoc_resume:latest -f "$REPO_ROOT/pandoc-sidecar/Dockerfile" "$REPO_ROOT/pandoc-sidecar"
  helm upgrade --install "$RELEASE_NAME" "$CHART" \
    --namespace "$NAMESPACE" \
    -f "$CHART/values-minikube.yaml" \
    --set image.resume.pullPolicy=Never \
    --set image.pandoc.pullPolicy=Never
else
  helm upgrade --install "$RELEASE_NAME" "$CHART" \
    --namespace "$NAMESPACE" \
    -f "$CHART/values-minikube.yaml"
fi

echo ""
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment -l "app.kubernetes.io/instance=$RELEASE_NAME" -n "$NAMESPACE" --timeout=120s 2>/dev/null || true
echo ""
echo "Get the app URL with:"
echo "  minikube service $RELEASE_NAME --url"
echo ""
minikube service "$RELEASE_NAME" --url 2>/dev/null || true
