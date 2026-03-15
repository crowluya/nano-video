export function isBuildTime() {
  return process.env.NEXT_PHASE === "phase-production-build";
}
