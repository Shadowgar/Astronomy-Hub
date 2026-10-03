import {normalizeRegionalWeather,weatherCodeLabel} from 'gods-eye-view/sources/regional';
import {PollingLayer} from './PollingLayer.mjs';
import {weatherPayloadValid,readCapped} from './data.mjs';
import {entityRenderer} from './entities.mjs';
export function createWeatherAdapter(context){
 const renderer=entityRenderer(context,'weather','#94e6c8');
 const layer=new PollingLayer({id:'weather',interval:300000,read:async signal=>{
  const site=context.observer(),url=new URL('https://api.open-meteo.com/v1/forecast');
  url.search=new URLSearchParams({latitude:String(site.lat),longitude:String(site.lon),current:'temperature_2m,weather_code,cloud_cover,wind_speed_10m',timezone:'UTC'});
  const payload=JSON.parse(await readCapped(await fetch(url,{signal}),100000));if(!weatherPayloadValid(payload))throw Error('Weather observation unavailable');const weather=normalizeRegionalWeather(payload);
  if(!weather?.observedAt||Math.abs(Date.now()-Date.parse(weather.observedAt))>7200000)throw Error('Weather timestamp stale');return {records:[weather],observedAt:weather.observedAt,site};
 },render:({records,site})=>{const weather=records[0];renderer.replace([{id:'current',name:'Weather · '+(weather.weatherCode===null?'conditions unavailable':weatherCodeLabel(weather.weatherCode)),lon:site.lon,lat:site.lat,heightM:site.elevationM,detail:'Open-Meteo modeled current conditions.',facts:[{label:'Temperature',value:weather.temperatureC+' °C'},...(weather.cloudCoverPct===null?[]:[{label:'Cloud cover',value:weather.cloudCoverPct+'%'}]),{label:'Valid time',value:weather.observedAt}]}]);},clear:unavailable=>renderer.clear(unavailable)});
 const initialize=layer.initialize.bind(layer);layer.initialize=ctx=>{initialize(ctx);ctx.attribution.set('weather','Open-Meteo · CC BY 4.0 · non-commercial API','https://open-meteo.com/en/terms')};
 const destroy=layer.destroy.bind(layer);layer.destroy=()=>{destroy();context.attribution.remove('weather')};return layer;
}
