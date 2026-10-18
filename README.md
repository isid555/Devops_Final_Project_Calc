# Calculator API

Small Express calculator service with validation, tests, container packaging, Kubernetes deployment configuration, and local metrics/tracing evidence.

## API

`POST /add`, `/sub`, `/mul`, and `/div` accept `{ "a": number, "b": number }`. Invalid operands and division by zero return `400`. `/health`, `/ready`, and `/metrics` provide health, readiness, and Prometheus scraping. `X-Request-ID` is accepted or generated and returned.

## Checks

Use Node.js 20 or later. Because this student project intentionally does not commit `package-lock.json`, run `npm install`, `npm test`, `npm run lint`, and `npm audit --audit-level=high`. The audit command is a gate; report current registry advisories rather than ignoring them.

## Docker

Build with `docker build -t calculator-api:local .`. Run the container on port 3000, then verify `/health`, a valid JSON operation, and an invalid request returning `400`. The image runs as non-root and excludes tests, Git metadata, and local dependencies.

## Kubernetes

Validate with `kubectl apply --dry-run=client -f k8/deployment.yml`. With kind or Minikube available, load `calculator-api:dev`, apply the manifest, check `kubectl rollout status deployment/calculator-api`, port-forward the Service, and test `/health`. Use `kubectl rollout undo deployment/calculator-api` to verify rollback. The CD workflow is manual and expects an explicit image tag; it is not triggered locally.

## Local observability

Run `docker compose -f docker-compose.observability.yml up --build`. The local services are:

- Calculator: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Grafana dashboard: `http://localhost:3001` (default login: `admin` / `admin`)
- Tempo API: `http://localhost:3200`

Grafana is provisioned with Prometheus and Tempo data sources and a small Calculator API dashboard showing request rate, error rate, and p95 latency. Prometheus scrapes `/metrics`, which exposes request totals, error totals, and latency histograms. OpenTelemetry creates incoming HTTP and calculator-operation spans and exports them to Tempo. Inspect JSON logs with `docker compose -f docker-compose.observability.yml logs calculator`; logs contain request and trace IDs.

Generate traffic with `curl -X POST -H 'content-type: application/json' -d '{"a":8,"b":2}' http://localhost:3000/div`, then refresh Grafana. Use the Tempo data source or Grafana Explore to inspect traces. Stop the stack with `docker compose -f docker-compose.observability.yml down`.

## Request path and recovery

Requests enter Express, receive a request ID, are traced, validated, executed, metered, and logged. Investigate failures by following the request ID in logs, checking request/error/latency metrics, and opening the trace by trace ID in Tempo.

Local target: valid smoke-test requests succeed, readiness remains healthy during rollout, and p95 latency stays below 250 ms under low local load. This is a demonstration target, not a production SLA. Verify recovery with rollout status, readiness, a successful request, and `kubectl rollout undo` for a bad revision.

## Limitations

No database, persistent state, authentication, cloud deployment, registry push, alerting, or production retention policy is added. Prometheus, Grafana, and Tempo are local demonstration components. Grafana uses its default local credentials and should not be exposed publicly. CI/CD is configured for review; remote workflows are not pushed or triggered here.
