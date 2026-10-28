import manifest from '../../../public/solar-assets/v2/manifest.json'

/** Appearance-only NASA resource contracts. JPL state remains independent. */
export type SolarVisualAssetId = 'jupiter' | 'saturn' | 'mercury' | 'venus' | 'uranus' | 'neptune' | 'eros'

export const solarVisualAssets = manifest.assets
export const solarRingAsset = manifest.ring
export const solarAssetDelivery = manifest.delivery

export function solarVisualAsset(id: string) {
  return solarVisualAssets.find(asset => asset.id === id)
}

/** Source body primitive only: Saturn's two ring meshes belong to a separate renderer. */
export function solarBodyMesh(asset: NonNullable<ReturnType<typeof solarVisualAsset>>) {
  return asset.meshes[0]
}

export const solarAssetDisclosure =
  'NASA visualization models and historical textures; appearance and orientation are illustrative, not current atmospheric measurements or qualified terrain. Orbital positions and time come from the separate scientific source.'
