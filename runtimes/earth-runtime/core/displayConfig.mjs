// Configuration is public deployment data. Never accept account/server credentials.
export function admitDisplayConfig(value){
 if(!value||value.schema!==1||value.qualified!==true)return null;
 if(Object.keys(value).some(k=>!['schema','qualified','publicToken','publicTokenAttested','imageryAsset','terrainAsset','buildingsAsset','photorealisticAsset'].includes(k)))return null;
 if(typeof value.publicToken!=='string'||value.publicToken.length<20||value.publicToken.length>2048||value.publicTokenAttested!==true)return null;
 for(const key of ['imageryAsset','terrainAsset','buildingsAsset','photorealisticAsset'])if(value[key]!==undefined&&(!Number.isSafeInteger(value[key])||value[key]<=0))return null;
 return value;
}
