import type { Constraint, ValidationOutcome } from "./types";
import { evaluateConstraints } from "./z3engine";

export * from "./types";

/**
 * Evaluate a constraint set deterministically and produce a full validation
 * outcome with a machine-checkable proof note. Overall feasibility is true only
 * when every HARD constraint passes; soft constraints surface as advisories.
 */
export async function validate(
  constraints: Constraint[]
): Promise<ValidationOutcome> {
  const start = Date.now();
  const { results, engine } = await evaluateConstraints(constraints);

  const hardFailures = results.filter(
    (r) => r.criticality === "hard" && r.result === "FAIL"
  ).length;
  const softFailures = results.filter(
    (r) => r.criticality === "soft" && r.result === "FAIL"
  ).length;
  const feasible = hardFailures === 0;

  const failed = results.filter((r) => r.result === "FAIL");
  const proof = feasible
    ? `All ${results.filter((r) => r.criticality === "hard").length} hard constraints satisfied (sat). Decision is provably compliant.`
    : `${hardFailures} hard constraint(s) violated (unsat): ${failed
        .filter((r) => r.criticality === "hard")
        .map((r) => `${r.label} [${r.actualDisplay} vs ${r.expectedDisplay}]`)
        .join("; ")}.`;

  return {
    feasible,
    constraints: results,
    engine,
    hardFailures,
    softFailures,
    evaluationMs: Date.now() - start,
    proof,
  };
}
