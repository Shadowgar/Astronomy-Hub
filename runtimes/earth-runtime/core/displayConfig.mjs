// Configuration is public deployment data. Never accept account/server credentials.
const validPublicImagery=value=>value===undefined||['blue-marble','usgs-conus'].includes(value);
export function admitDisplayConfig(value){
 if(!value||value.schema!==1||value.qualified!==true||!validPublicImagery(value.publicImagery))return null;
 if(Object.keys(value).some(k=>!['schema','qualified','publicImagery','publicToken','publicTokenAttested','imageryAsset','terrainAsset','buildingsAsset','photorealisticAsset','ionImageryOptIn','zeroChargeProtectionAttested','ionSessionTileLimit'].includes(k)))return null;
 if(typeof value.publicToken!=='string'||value.publicToken.length<20||value.publicToken.length>2048||value.publicTokenAttested!==true)return null;
 for(const key of ['imageryAsset','terrainAsset','buildingsAsset','photorealisticAsset'])if(value[key]!==undefined&&(!Number.isSafeInteger(value[key])||value[key]<=0))return null;
 for(const key of ['ionImageryOptIn','zeroChargeProtectionAttested'])if(value[key]!==undefined&&typeof value[key]!=='boolean')return null;
 if(value.ionSessionTileLimit!==undefined&&(!Number.isSafeInteger(value.ionSessionTileLimit)||value.ionSessionTileLimit<1||value.ionSessionTileLimit>120))return null;
 return value;
}

// A token alone is never authority to dispatch ion requests. Attestation must be
// backed by a real account-side zero-charge protection arrangement outside this app.
export function admitIonImagery(value){const config=admitDisplayConfig(value);return config?.imageryAsset&&config.ionImageryOptIn===true&&config.zeroChargeProtectionAttested===true&&config.ionSessionTileLimit?config:null;}

export function isPublicDisplayConfig(value){
 if(value?.schema===1&&value.qualified===false)return validPublicImagery(value.publicImagery)&&Object.keys(value).every(key=>['schema','qualified','publicImagery'].includes(key));
 return admitDisplayConfig(value)!==null;
}
