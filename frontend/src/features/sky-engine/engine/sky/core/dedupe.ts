import type { RuntimeStar } from '../contracts/stars'

export function dedupeRuntimeStars(stars: readonly RuntimeStar[]) {
  const dedupedStars = new Map<string, RuntimeStar>()

  stars.forEach((star) => {
    const existing = dedupedStars.get(star.id)

    if (!existing || star.mag < existing.mag) {
      dedupedStars.set(star.id, star)
    }
  })

  return Array.from(dedupedStars.values())
}