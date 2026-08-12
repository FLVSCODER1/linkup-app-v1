const INTEREST_CATEGORY_MAP: Record<string, string[]> = {
  art: ["arts"],
  arts: ["arts"],
  business: ["club", "academic"],
  clubs: ["club"],
  fitness: ["sports"],
  gaming: ["gaming"],
  music: ["music"],
  sports: ["sports"],
  stem: ["academic", "competition"],
  theater: ["arts"],
  theatre: ["arts"],
  volunteering: ["volunteering", "fundraiser"],
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function interestCategoryIds(interests: string[]): Set<string> {
  const categories = new Set<string>();

  for (const interest of interests) {
    const normalized = normalize(interest);
    const mapped = INTEREST_CATEGORY_MAP[normalized] ?? [normalized];
    mapped.forEach((category) => categories.add(category));
  }

  return categories;
}
