import { describe, expect, it, vi } from 'vitest'
import { buildOrasNativeCandidates, findOrasNativeCandidate, toOrasSkySource } from '../../vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js'

describe('star science and bounded native navigation', () => {
  it('uses one science record without treating source G as Johnson V', () => {
    const science = {
      schema_version: 1, ra: 178.244863913584, dec: 37.718681698954,
      coordinate_epoch: 2000, coordinate_frame: 'ICRS',
      source_id: '4034171629042489088', source_catalog: 'Gaia DR3',
      source_magnitude: 6, source_magnitude_band: 'Gaia G',
      visual_magnitude: 6.3, visual_magnitude_method: 'gaia_edr3_transformed',
      render_magnitude: 6.3, render_magnitude_band: 'V',
      render_magnitude_method: 'gaia_edr3_transformed',
      color_index: 1.2, color_index_band: 'Gaia BP-RP', bv: 0.9,
      proper_motion_ra_mas_per_year: 4002.655, proper_motion_dec_mas_per_year: -5817.8,
      parallax_mas: 109.0296, radial_velocity_km_s: -98,
      spectral_type: 'M2V', gaia_id: '4034171629042489088'
    }
    const source = toOrasSkySource({catalog: 'Gaia DR3', source_id: science.source_id,
      model: 'star', ra: science.ra, dec: science.dec, magnitude: 6,
      magnitude_band: 'Gaia G', star_science: science})
    expect(source.star_science).toEqual(science)
    expect(source.model_data).toMatchObject({Vmag:6.3, BVMag:0.9, epoch:2000,
      pm_ra:4002.655, pm_de:-5817.8, plx:109.0296, spect_t:'M2V', gaia:science.source_id})
    expect(source.phot_g_mean_mag).toBeNull()
  })
  it('preserves zero visual magnitude and unknown color without inventing BV', () => {
    const source=toOrasSkySource({catalog:'Hipparcos',source_id:'hip-1',model:'star',
      star_science:{schema_version:1,ra:1,dec:2,coordinate_epoch:2000,
        render_magnitude:0,render_magnitude_band:'V',bv:null,hip_id:'1'}})
    expect(source.model_data.Vmag).toBe(0)
    expect(source.model_data.BVMag).toBeUndefined()
    expect(source.model_data.hip).toBe(1)
  })
  it('never expands a star into Messier/NGC/IC candidates or corrupts large IDs', () => {
    const candidates=buildOrasNativeCandidates({model:'star',catalog:'Gaia DR3',source_id:'4034171629042489088',names:['Betelgeuse','Martial Star','HIP 27989']})
    expect(candidates[0]).toBe('GAIA 4034171629042489088')
    expect(candidates.some(x=>/^(M |NGC |IC )/.test(x))).toBe(false)
    expect(candidates.length).toBeLessThanOrEqual(12)
  })
  it('stops native calls at the first match', () => {
    const match={v:42}; const getObj=vi.fn(n=>n==='HIP 27989'?match:null)
    const result=findOrasNativeCandidate({getObj},{model:'star',catalog:'Hipparcos',source_id:'hip-27989',names:['Betelgeuse','Martial Star']})
    expect(result).toBe(match);expect(getObj).toHaveBeenCalledTimes(1)
  })
  it('retains compact DSO designation lookup',()=>{
    expect(buildOrasNativeCandidates({model:'dso',source_id:'M31',names:['M31']})).toContain('M 31')
  })
})
