// Test-only subset of the qualified Solar API's reference mean radii (km).
import type {SolarSnapshot,BodyId} from '../../src/features/solar/solarContracts'
const meanKm={sun:695700,mercury:2439.7,venus:6051.8,earth:6371,mars:3389.5,jupiter:69911,saturn:58232,uranus:25362,neptune:24622}
export const radiusSnapshot={km_per_au:149597870.7,bodies:Object.entries(meanKm).map(([source_id,mean_radius_km])=>({source_id,shape:{mean_radius_km}}))} as SolarSnapshot
export const radii=Object.fromEntries(Object.entries(meanKm).map(([id,km])=>[id,km/149597870.7])) as Record<BodyId,number>
