function add(a, b) {
  return a + b;
}

function sub(a, b) {
  return a - b;
}

function mul(a, b) {
  return a * b;
}

function div(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

function validateOperands(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error("Operands a and b must be finite numbers");
  }
}

module.exports = { add, sub, mul, div, validateOperands };
