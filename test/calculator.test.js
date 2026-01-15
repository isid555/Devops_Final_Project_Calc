const { add, sub, mul, div } = require("../src/calculator");

describe("Calculator Operations", () => {
  test("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  test("subtracts two numbers", () => {
    expect(sub(5, 3)).toBe(2);
  });

  test("multiplies two numbers", () => {
    expect(mul(4, 2)).toBe(8);
  });

  test("divides two numbers", () => {
    expect(div(10, 2)).toBe(5);
  });

  test("throws error on division by zero", () => {
    expect(() => div(10, 0)).toThrow("Division by zero");
  });
});
