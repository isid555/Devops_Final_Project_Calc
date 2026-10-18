# Calculator API

Small Express calculator service with validation, tests, container packaging, Kubernetes deployment configuration, and local metrics/tracing evidence.

## API

`POST /add`, `/sub`, `/mul`, and `/div` accept `{ "a": number, "b": number }`. Invalid operands and division by zero return `400`. `/health`, `/ready`, and `/metrics` provide health, readiness, and Prometheus scraping. `X-Request-ID` is accepted or generated and returned.

## Checks

Use Node.js 20 or later. Run `npm ci`, `npm test`, `npm run lint`, and `npm audit --audit-level=high`. The audit command is a gate; report current registry advisories rather than ignoring them.

## Docker

Build with `docker build -t calculator-api:local .`. Run the container on port 3000, then verify `/health`, a valid JSON operation, and an invalid request returning `400`. The image runs as non-root and excludes tests, Git metadata, and local dependencies.

## Kubernetes

Validate with `kubectl apply --dry-run=client -f k8/deployment.yml`. With kind or Minikube available, load `calculator-api:dev`, apply the manifest, check `kubectl rollout status deployment/calculator-api`, port-forward the Service, and test `/health`. Use `kubectl rollout undo deployment/calculator-api` to verify rollback. The CD workflow is manual and expects an explicit image tag; it is not triggered locally.

## Local observability

Run `docker compose -f docker-compose.observability.yml up --build`. Prometheus is at `http://localhost:9090`, Tempo at `http://localhost:3200`, and the calculator at `http://localhost:3000`. Inspect JSON logs with `docker compose -f docker-compose.observability.yml logs calculator`. Prometheus scrapes `/metrics`; OpenTelemetry covers the incoming HTTP request and calculator operation; logs contain request and trace IDs.

## Request path and recovery

Requests enter Express, receive a request ID, are traced, validated, executed, metered, and logged. Investigate failures by following the request ID in logs, checking metrics, and opening the trace by trace ID.

Local target: valid smoke-test requests succeed, readiness remains healthy during rollout, and p95 latency stays below 250 ms under low local load. This is a demonstration target, not a production SLA. Verify recovery with rollout status, readiness, a successful request, and `kubectl rollout undo` for a bad revision.

## Limitations

No database, persistent state, authentication, cloud deployment, registry push, alerting, or production retention policy is added. Prometheus and Tempo are local demonstration components. CI/CD is configured for review; remote workflows are not pushed or triggered here.
