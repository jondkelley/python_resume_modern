# Helm chart: python-resume

Deploy the resume app (Flask + Pandoc sidecar) to any Kubernetes cluster using Helm.

## Prerequisites

- [Helm 3](https://helm.sh/docs/intro/install/)
- Kubernetes cluster (minikube, kind, or any other)

## Quick install (minikube or kind)

Use the images published to Docker Hub:

```bash
# From repo root

# Minikube
./scripts/helm-install-minikube.sh
minikube service python-resume --url   # open this URL

# Kind
./scripts/helm-install-kind.sh
kubectl port-forward svc/python-resume 5001:80   # then open http://localhost:5001
```

## Install with Helm directly

```bash
# Add namespace (optional)
kubectl create namespace resume-demo

# Install with default values (NodePort, good for minikube/kind)
helm upgrade --install python-resume ./helm/python-resume --namespace resume-demo

# Minikube: use profile values
helm upgrade --install python-resume ./helm/python-resume -f helm/python-resume/values-minikube.yaml

# Kind: use profile values
helm upgrade --install python-resume ./helm/python-resume -f helm/python-resume/values-kind.yaml

# Production-style (LoadBalancer)
helm upgrade --install python-resume ./helm/python-resume \
  --set service.type=LoadBalancer
```

## Using locally built images (minikube / kind)

So you can demo without pushing to Docker Hub:

**Minikube:**

```bash
./scripts/helm-install-minikube.sh --build-load
minikube service python-resume --url
```

**Kind:**

```bash
./scripts/helm-install-kind.sh --build-load
kubectl port-forward svc/python-resume 5001:80
# Open http://localhost:5001
```

## Overriding the resume update secret

The app uses a secret for dynamic resume updates. Default is `changeme`. Override:

```bash
helm upgrade --install python-resume ./helm/python-resume \
  --set resumeUpdateSecret=your-secret
```

Or use an existing secret (e.g. SealedSecret):

```bash
helm upgrade --install python-resume ./helm/python-resume \
  --set existingSecret=secret-jonk-resume-app \
  --set existingSecretKey=resume-update-secret
```

## Uninstall

```bash
helm uninstall python-resume --namespace default
# Or with custom namespace:
helm uninstall python-resume --namespace resume-demo
```

## Chart values

| Value | Description | Default |
|-------|-------------|---------|
| `replicaCount` | Number of pod replicas | `1` |
| `image.resume.repository` | Resume app image | `jondkelley/python_resume` |
| `image.resume.tag` | Resume app tag | `latest` |
| `image.pandoc.repository` | Pandoc sidecar image | `jondkelley/pandoc_resume` |
| `image.pandoc.tag` | Pandoc sidecar tag | `latest` |
| `service.type` | Service type | `NodePort` |
| `service.nodePort` | Fixed NodePort (optional) | `null` |
| `resumeUpdateSecret` | Secret for resume update API | `changeme` |
| `existingSecret` | Use existing secret name | `""` |

See [values.yaml](python-resume/values.yaml) for all options.
