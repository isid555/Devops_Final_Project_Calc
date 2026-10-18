const request = require("supertest");
const app = require("../src/index");

describe("HTTP API", () => {
  test("performs an operation", async () => {
    const response = await request(app).post("/add").send({ a: 2, b: 3 });
    expect(response.status).toBe(200);
    expect(response.body.result).toBe(5);
  });

  test("rejects invalid input and division by zero", async () => {
    expect((await request(app).post("/add").send({ a: "2", b: 3 })).status).toBe(400);
    const response = await request(app).post("/div").send({ a: 2, b: 0 });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Division by zero");
  });

  test("serves health, readiness and metrics", async () => {
    expect((await request(app).get("/health")).status).toBe(200);
    expect((await request(app).get("/ready")).status).toBe(200);
    expect((await request(app).get("/metrics")).text).toContain("calculator_http_request_duration_seconds");
  });
});
