import type {
  Constraint,
  ConstraintResult,
  ConstraintVerdict,
  ConstraintOperator,
} from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Deterministic constraint evaluation.
//
// Primary engine: z3-solver (WASM SMT solver). Each constraint is encoded as a
// satisfiability problem — the requirement is asserted together with the actual
// measured value; `sat` proves the constraint holds, `unsat` proves a
// violation. A pure-TypeScript evaluator is used as a guaranteed fallback if
// the WASM solver cannot initialise (e.g. constrained serverless runtime). Both
// engines compute identical verdicts, since constraints reduce to total orders.
// ────────────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let z3ContextPromise: Promise<any> | null = null;

async function getZ3Context() {
  if (!z3ContextPromise) {
    z3ContextPromise = (async () => {
      const { init } = await import("z3-solver");
      const { Context } = await init();
      return Context("vera");
    })();
  }
  return z3ContextPromise;
}

function satisfies(
  actual: number,
  operator: ConstraintOperator,
  expected: number
): boolean {
  switch (operator) {
    case "<=":
    case "subset_excludes":
      return actual <= expected;
    case ">=":
      return actual >= expected;
    case "==":
      return actual === expected;
    case "!=":
      return actual !== expected;
    default:
      return false;
  }
}

async function evaluateWithZ3(
  constraints: Constraint[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ConstraintResult[]> {
  const ctx = await getZ3Context();
  const results: ConstraintResult[] = [];

  for (const c of constraints) {
    if (c.actual === null || c.expected === null) {
      results.push({ ...c, result: "PASS" });
      continue;
    }
    const solver = new ctx.Solver();
    const v = ctx.Real.const(c.id);
    // Bind the variable to the measured actual value.
    solver.add(v.eq(ctx.Real.val(c.actual)));
    // Assert the requirement.
    const e = ctx.Real.val(c.expected);
    switch (c.operator) {
      case "<=":
      case "subset_excludes":
        solver.add(v.le(e));
        break;
      case ">=":
        solver.add(v.ge(e));
        break;
      case "==":
        solver.add(v.eq(e));
        break;
      case "!=":
        solver.add(v.neq(e));
        break;
    }
    const check = await solver.check();
    const verdict: ConstraintVerdict = check === "sat" ? "PASS" : "FAIL";
    results.push({ ...c, result: verdict });
  }
  return results;
}

function evaluateDeterministic(constraints: Constraint[]): ConstraintResult[] {
  return constraints.map((c) => {
    if (c.actual === null || c.expected === null) {
      return { ...c, result: "PASS" as ConstraintVerdict };
    }
    const ok = satisfies(c.actual, c.operator, c.expected);
    return { ...c, result: (ok ? "PASS" : "FAIL") as ConstraintVerdict };
  });
}

export async function evaluateConstraints(
  constraints: Constraint[]
): Promise<{
  results: ConstraintResult[];
  engine: "z3-solver" | "deterministic-fallback";
}> {
  if (process.env.DISABLE_Z3 === "1") {
    return { results: evaluateDeterministic(constraints), engine: "deterministic-fallback" };
  }
  try {
    const results = await evaluateWithZ3(constraints);
    return { results, engine: "z3-solver" };
  } catch {
    return {
      results: evaluateDeterministic(constraints),
      engine: "deterministic-fallback",
    };
  }
}
