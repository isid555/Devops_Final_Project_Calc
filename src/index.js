const express = require("express");
const { add, sub, mul, div } = require("./calculator");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/add", (req, res) => {
  res.json({ result: add(req.body.a, req.body.b) });
});

app.post("/sub", (req, res) => {
  res.json({ result: sub(req.body.a, req.body.b) });
});

app.post("/mul", (req, res) => {
  res.json({ result: mul(req.body.a, req.body.b) });
});

app.post("/div", (req, res) => {
  try {
    res.json({ result: div(req.body.a, req.body.b) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Calculator API running on port ${PORT}`);
});
