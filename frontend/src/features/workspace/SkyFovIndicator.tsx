import React from 'react'
export function formatSkyFov(fovRad:number|null){
 if(fovRad===null||!Number.isFinite(fovRad)||fovRad<=0||fovRad>2*Math.PI)return '—'
 const degrees=fovRad*180/Math.PI
 const digits=degrees>=10?0:degrees>=1?1:Math.max(2,1-Math.floor(Math.log10(degrees)))
 const value=digits>8?degrees.toPrecision(2):degrees.toFixed(digits).replace(/(\.\d*?[1-9])0+$|\.0+$/,'$1')
 return value+'°'
}
export function SkyFovIndicator({fovRad}:{fovRad:number|null}){
 const label=formatSkyFov(fovRad)
 return <output className="as-fov ws-panel" tabIndex={0} aria-live="off" aria-label={`Field of view ${label==='—'?'unavailable':label.replace('°',' degrees')}`} title={fovRad===null?'Waiting for native field of view':`Native field of view: ${fovRad*180/Math.PI}°`}>FOV {label}</output>
}
