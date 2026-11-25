// Valorant bracket results, as published in the organisers' STANDINGS doc
// (25 Nov). Best of one, so each is recorded as a 1–0 map win. The full
// platform has the same results.

/** Match id → the side that won. */
export const VALORANT_RESULTS: Record<string, "A" | "B"> = {
  "VAL-R32-01": "A", "VAL-R32-02": "B", "VAL-R32-03": "A", "VAL-R32-04": "A",
  "VAL-R32-05": "B", "VAL-R32-06": "A", "VAL-R32-07": "A", "VAL-R32-08": "A",
  "VAL-R32-09": "A", "VAL-R32-10": "B", "VAL-R32-11": "A", "VAL-R32-12": "A",
  "VAL-R32-13": "A", "VAL-R32-14": "A", "VAL-R32-15": "A", "VAL-R32-16": "A",
  "VAL-R16-01": "B", "VAL-R16-02": "B",
};
