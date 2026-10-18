const express = require("express");
const crypto = require("crypto");
const { add, sub, mul, div, validateOperands } = require("./calculator");

const app = express();
const counts = { requests: 0, errors: 0 };
app.use(express.json());
app.use((req, res, next) => {
  req.requestId = req.get("x-request-id") || crypto.randomBytes(16).toString("hex");
  req.traceId = crypto.randomBytes(16).toString("hex");
  res.setHeader("x-request-id", req.requestId);
  counts.requests += 1;
  const start = Date.now();
  res.on("finish", () => {
    if (res.statusCode >= 400) counts.errors += 1;
    console.log(JSON.stringify({ requestId: req.requestId, traceId: req.traceId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start }));
  });
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/ready", (req, res) => res.json({ status: "ready" }));
app.get("/metrics", (req, res) => res.type("text/plain").send(`# HELP calculator_requests_total Total requests\ncalculator_requests_total ${counts.requests}\n# HELP calculator_errors_total Total errors\ncalculator_errors_total ${counts.errors}\n`));

function route(operation) {
  return (req, res) => {
    try {
      validateOperands(req.body?.a, req.body?.b);
      res.json({ result: operation(req.body.a, req.body.b) });
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
if (require.main === module) app.listen(PORT, () => console.log(`Calculator API running on port ${PORT}`));
module.exports = app;
