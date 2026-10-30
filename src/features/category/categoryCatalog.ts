import type { CategoryKind } from "./categoryKind";

export type CategoryEntry = {
  name: string;
  kind: CategoryKind | undefined;
  excluded: boolean;
};

export class CategoryCatalog {
  private constructor(private readonly entries: ReadonlyMap<string, CategoryEntry>) {}

  static of(entries: readonly CategoryEntry[]): CategoryCatalog {
    const byName = new Map<string, CategoryEntry>();
    for (const entry of entries) {
      const name = entry.name.trim();
      if (!byName.has(name)) {
        byName.set(name, { ...entry, name });
      }
    }
    return new CategoryCatalog(byName);
  }

  lists(category: string): boolean {
    return this.entries.has(category.trim());
  }

  kindOf(category: string): CategoryKind | undefined {
    return this.entries.get(category.trim())?.kind;
  }

  isExcluded(category: string): boolean {
    return this.entries.get(category.trim())?.excluded === true;
  }

  excludedNames(): string[] {
    const names = [...this.entries.values()]
      .filter((entry) => entry.excluded)
      .map((entry) => entry.name.slice(entry.name.lastIndexOf("-") + 1));
    return [...new Set(names)];
  }

  categoriesWithoutKind(): string[] {
    return [...this.entries.values()]
      .filter((entry) => entry.kind === undefined)
      .map((entry) => entry.name);
  }
}
