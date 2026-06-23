# HLLC Store k8s

This directory contains the minimal Kubernetes manifests for running the app on k3s behind Traefik.

## What it assumes

- Public host: `hllc.mfu.ac.th`
- App mounted at: `/store`
- Backend service name: `backend`
- Frontend service name: `frontend`
- MongoDB is external and reached through `MONGODB_URI`

## Files

- `namespace.yaml`: namespace for the app
- `configmap.yaml`: non-secret runtime config
- `secret.example.yaml`: example secret manifest, not applied by default
- `backend.yaml`: backend Deployment, Service, and uploads PVC
- `frontend.yaml`: frontend Deployment and Service
- `ingress.yaml`: Traefik ingress rules
- `.github/workflows/deploy.yml`: CI/CD pipeline for build and deploy

## GitHub Secrets

Create these GitHub Secrets before running the workflow:

- `ADMIN_USERNAME`: admin login username used by backend and config map
- `MONGODB_DB`: MongoDB database name used by backend
- `KUBECONFIG_B64`: base64-encoded kubeconfig for the cluster
- `MONGODB_URI`: external MongoDB connection string
- `ADMIN_SESSION_SECRET`: session signing secret
- `ADMIN_PASSWORD_HASH`: scrypt hash for the admin password
- `SITE_URL`: public store URL, for example `https://hllc.mfu.ac.th/store`

Optional secrets for email delivery, if you use that path:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `GMAIL_OAUTH_CLIENT_ID`
- `GMAIL_OAUTH_CLIENT_SECRET`
- `GMAIL_OAUTH_REFRESH_TOKEN`

## How the workflow works

The workflow:

- builds and pushes frontend/backend images to GHCR
- creates the live Kubernetes Secret from GitHub Secrets at deploy time
- renders `ADMIN_USERNAME` and `MONGODB_DB` into the ConfigMap from GitHub Secrets
- rewrites the image names in the checked-out manifests
- applies `k8s/` with `kubectl apply -k`

## Apply manually

If you want to apply by hand after the secret already exists in the cluster:

```bash
kubectl apply -k k8s
```

## Notes

- Frontend requests to `/api/*` and `/uploads/*` are expected to go directly through the Ingress to the backend service.
- Frontend SSR still uses `BACKEND_URL=http://backend:3001` inside the cluster.
- Uploads use a PVC, so storage provisioner support is required in the cluster.
