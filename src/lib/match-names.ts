// Matching organisers' published team names to registered teams. Pure, so
// plain Node can run it.

/** Comparable form of a team name: case, spacing and punctuation don't matter. */
export function nameKey(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}$]+/gu, "");
}

/** Letters and digits only, for names decorated with symbols (亖KRAKEN_BLAZE亖). */
const plainKey = (name: string) => nameKey(name).replace(/[^a-z0-9$]+/g, "");

/**
 * Matches each published name to one registered team: the same name ignoring
 * case and punctuation, else the one team whose name starts with it (docs
 * shorten names like "Sapne Suhane..."), else the one team whose name it
 * starts with, else the one team whose name contains it once symbols are
 * stripped. `chosen` holds a referee's picks for names
 * that didn't match on their own; a team is never matched twice.
 */
export function matchNames(
  names: string[],
  teams: { id: string; name: string }[],
  chosen: Partial<Record<string, string>> = {},
): { ids: Map<string, string>; missing: string[] } {
  const ids = new Map<string, string>();
  const taken = new Set<string>();
  for (const name of names) {
    const pick = chosen[name];
    if (pick && !taken.has(pick) && teams.some((t) => t.id === pick)) {
      ids.set(name, pick);
      taken.add(pick);
    }
  }
  const tries: ((key: string, plain: string, t: { name: string }) => boolean)[] = [
    (key, _, t) => nameKey(t.name) === key,
    (key, _, t) => key.length >= 4 && nameKey(t.name).startsWith(key),
    // Registered without the doc's extra, e.g. "Nongshim RedForce" for "Nongshim RedForce (NSR)".
    (key, _, t) => nameKey(t.name).length >= 6 && key.startsWith(nameKey(t.name)),
    (_, plain, t) => plain.length >= 5 && plainKey(t.name).includes(plain),
  ];
  // Each rule runs over every name before the next, looser one, so a loose
  // rule never takes a team another name matches exactly. A name that fits
  // several teams under a rule is left for a pick.
  const ambiguous = new Set<string>();
  for (const test of tries) {
    for (const name of names) {
      if (ids.has(name) || ambiguous.has(name)) continue;
      const hits = teams.filter((t) => !taken.has(t.id) && test(nameKey(name), plainKey(name), t));
      if (hits.length > 1) ambiguous.add(name);
      if (hits.length !== 1) continue;
      ids.set(name, hits[0].id);
      taken.add(hits[0].id);
    }
  }
  return { ids, missing: names.filter((n) => !ids.has(n)) };
}
