import manifest from '../../../public/solar-assets/v2/manifest.json'
import lodManifest from '../../../public/solar-assets/v2.2/manifest.json'

/** Appearance-only NASA resource contracts. JPL state remains independent. */
export type SolarVisualAssetId = 'jupiter' | 'saturn' | 'mercury' | 'venus' | 'uranus' | 'neptune' | 'eros'

export const solarVisualAssets = manifest.assets
export const solarRingAsset = manifest.ring
export const solarAssetDelivery = manifest.delivery
export type SolarImageLOD={url:string;width:number;height:number;bytes:number;sha256:string}
export type SolarOverviewAsset={mapping:string;source:string;modelUrl?:string;mapUrl?:string;overview:{width:number;height:number;bytes:number;sha256:string};detail:SolarImageLOD[]}
export const solarOverviewAssets:Record<string,SolarOverviewAsset>=lodManifest.assets

/** Select a source LOD before fetching: Balanced must not fetch an 8k source
 * merely to shrink it to 4k. Never claim a larger size than the source provides. */
export function solarDetailAsset(id:string,maxSize:number){
 const asset=solarOverviewAssets[id]
 if(!asset?.detail.length)return null
 const available=asset.detail.filter(image=>Math.max(image.width,image.height)<=maxSize)
 const image=available.at(-1)??asset.detail[0]
 return{asset,image}
}

export function solarVisualAsset(id: string) {
  return solarVisualAssets.find(asset => asset.id === id)
}

/** Source body primitive only: Saturn's two ring meshes belong to a separate renderer. */
export function solarBodyMesh(asset: NonNullable<ReturnType<typeof solarVisualAsset>>) {
  return asset.meshes[0]
}

export const solarAssetDisclosure =
  'NASA visualization models, historical Blue Marble Earth and NASA/JPL/USGS Viking Mars imagery; colors and non-Earth orientation are illustrative, not current weather or qualified terrain. Orbital positions and time come from the separate scientific source.'
