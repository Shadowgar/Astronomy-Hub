// Configuration is public deployment data. Never accept account/server credentials.
const validPublicImagery=value=>value===undefined||['blue-marble','usgs-conus'].includes(value);
export function admitDisplayConfig(value){
 if(!value||value.schema!==1||value.qualified!==true||!validPublicImagery(value.publicImagery))return null;
 if(Object.keys(value).some(k=>!['schema','qualified','publicImagery','publicToken','publicTokenAttested','imageryAsset','terrainAsset','buildingsAsset','photorealisticAsset'].includes(k)))return null;
 if(typeof value.publicToken!=='string'||value.publicToken.length<20||value.publicToken.length>2048||value.publicTokenAttested!==true)return null;
 for(const key of ['imageryAsset','terrainAsset','buildingsAsset','photorealisticAsset'])if(value[key]!==undefined&&(!Number.isSafeInteger(value[key])||value[key]<=0))return null;
 return value;
}

export function isPublicDisplayConfig(value){
 if(value?.schema===1&&value.qualified===false)return validPublicImagery(value.publicImagery)&&Object.keys(value).every(key=>['schema','qualified','publicImagery'].includes(key));
 return admitDisplayConfig(value)!==null;
}
