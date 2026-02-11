#!/usr/bin/env bash
# Install or upgrade python-resume in kind using Helm.
# Usage:
#   ./scripts/helm-install-kind.sh              # use images from Docker Hub
#   ./scripts/helm-install-kind.sh --build-load # build locally and load into kind

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHART="${REPO_ROOT}/helm/python-resume"
RELEASE_NAME="${RELEASE_NAME:-python-resume}"
NAMESPACE="${NAMESPACE:-default}"
KIND_CLUSTER="${KIND_CLUSTER:-kind}"

BUILD_LOAD=false
for arg in "$@"; do
  case "$arg" in
    --build-load) BUILD_LOAD=true ;;
    -h|--help)
      echo "Usage: $0 [--build-load]"
      echo "  --build-load  Build images locally and load into kind cluster"
      exit 0
      ;;
  esac
done

if ! kind get kubeconfig --name "$KIND_CLUSTER" &>/dev/null; then
  echo "Kind cluster '$KIND_CLUSTER' not found. Create one with: kind create cluster"
  exit 1
fi

if [[ "$BUILD_LOAD" == true ]]; then
  echo "Building images and loading into kind..."
  docker build -t jondkelley/python_resume:latest "$REPO_ROOT"
  docker build -t jondkelley/pandoc_resume:latest -f "$REPO_ROOT/pandoc-sidecar/Dockerfile" "$REPO_ROOT/pandoc-sidecar"
  kind load docker-image jondkelley/python_resume:latest --name "$KIND_CLUSTER"
  kind load docker-image jondkelley/pandoc_resume:latest --name "$KIND_CLUSTER"
  helm upgrade --install "$RELEASE_NAME" "$CHART" \
    --namespace "$NAMESPACE" \
    -f "$CHART/values-kind.yaml" \
    --set image.resume.pullPolicy=Never \
    --set image.pandoc.pullPolicy=Never
else
  helm upgrade --install "$RELEASE_NAME" "$CHART" \
    --namespace "$NAMESPACE" \
    -f "$CHART/values-kind.yaml"
fi

echo ""
echo "Waiting for deployment to be ready..."
kubectl rollout status deployment -l "app.kubernetes.io/instance=$RELEASE_NAME" -n "$NAMESPACE" --timeout=120s 2>/dev/null || true
echo ""
echo "Get the app URL (from host):"
echo "  kubectl port-forward svc/$RELEASE_NAME 5001:80   # then open http://localhost:5001"
echo "  # Or use NodePort: kubectl get svc $RELEASE_NAME -o wide"
echo ""
kubectl get svc "$RELEASE_NAME" -n "$NAMESPACE" 2>/dev/null || true
