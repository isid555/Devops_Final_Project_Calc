const express = require("express");
const crypto = require("crypto");
const client = require("prom-client");
const { trace } = require("@opentelemetry/api");
const { add, sub, mul, div, validateOperands } = require("./calculator");

const app = express();
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
const requests = new client.Counter({ name: "calculator_http_requests_total", help: "Total HTTP requests", labelNames: ["method", "path", "status"] });
const errors = new client.Counter({ name: "calculator_http_errors_total", help: "Total HTTP errors", labelNames: ["method", "path", "status"] });
const duration = new client.Histogram({ name: "calculator_http_request_duration_seconds", help: "HTTP request duration", labelNames: ["method", "path", "status"] });
registry.registerMetric(requests);
registry.registerMetric(errors);
registry.registerMetric(duration);
app.use(express.json());
app.use((req, res, next) => {
  req.requestId = req.get("x-request-id") || crypto.randomBytes(16).toString("hex");
  req.traceId = crypto.randomBytes(16).toString("hex");
  res.setHeader("x-request-id", req.requestId);
  const start = Date.now();
  res.on("finish", () => {
    const labels = { method: req.method, path: req.path, status: String(res.statusCode) };
    requests.inc(labels);
    duration.observe(labels, (Date.now() - start) / 1000);
    if (res.statusCode >= 400) errors.inc(labels);
    console.log(JSON.stringify({ requestId: req.requestId, traceId: req.traceId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start }));
  });
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/ready", (req, res) => res.json({ status: "ready" }));
app.get("/metrics", async (req, res) => res.type("text/plain").send(await registry.metrics()));

function route(operation) {
  return (req, res) => {
    try {
      validateOperands(req.body?.a, req.body?.b);
      const span = trace.getTracer("calculator").startSpan(`calculator.${operation.name}`);
      const result = operation(req.body.a, req.body.b);
      span.end();
      res.json({ result });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
}

app.post("/add", route(add));
app.post("/sub", route(sub));
app.post("/mul", route(mul));
app.post("/div", route(div));

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  const { NodeSDK } = require("@opentelemetry/sdk-node");
  const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
  const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces" }),
    instrumentations: [new HttpInstrumentation()]
  });
  sdk.start();
  app.listen(PORT, () => console.log(`Calculator API running on port ${PORT}`));
  process.on("SIGTERM", async () => { await sdk.shutdown(); process.exit(0); });
}
module.exports = app;
