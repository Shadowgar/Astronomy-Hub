export type EarthEventRecord={id:string;name:string;lat:number;lon:number;occurredAt:string|null;updatedAt:string|null;magnitude:number|null;depthKm:number|null;acres:number|null;containedPct:number|null;polygons:number[][][][]|null}
export type EarthEventFeed={schemaVersion:1;kind:'earthquakes'|'fire-perimeters';temporalMode:'EVENT_FEED'|'CURRENT_SNAPSHOT';source:string;observedAt:string|null;fetchedAt:string;records:EarthEventRecord[];limited:boolean}
export type RadarFeed={schemaVersion:1;product:'radar';temporalMode:'CURRENT_SNAPSHOT';source:'NOAA/NWS nowCOAST';latest:string;times:[string];bounds:{west:-130;south:20;east:-60;north:55};fetchedAt:string;tileSize:256;maxLevel:6;tilingScheme:'geographic'}
export function validEventFeed(value:unknown,kind:'earthquakes'|'fire-perimeters'):value is EarthEventFeed
export function validRadarFeed(value:unknown):value is RadarFeed
export function validPolygons(value:unknown):value is number[][][][]
