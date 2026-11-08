/**
 * Optional native Cesium terrain adapter. It does not construct a scene or change
 * PlanetRuntime defaults. The explicit caller owns installation and disposal.
 * Cesium is supplied by the existing runtime so there is no second SDK instance.
 */
export function createLolaTerrainProvider(Cesium, admittedGrid, { signal } = {}) {
  const { Ellipsoid, GeographicTilingScheme, HeightmapTerrainData, TerrainProvider, TileAvailability, Event, Credit, Math: CMath } = Cesium;
  const source = admittedGrid.source;
  if (source.mapReferenceFrame !== 'MEAN EARTH/POLAR AXIS OF DE421' || source.referenceRadiusMeters !== 1737400 || source.width !== 1440 || source.height !== 720) {
    throw Error('Unsupported lunar terrain source/frame');
  }
  // 180 degrees / 2^3 / 90 intervals = 0.25 degrees: never claim finer source.
  const width = 91, maximumLevel = 3;
  const ellipsoid = new Ellipsoid(1737400, 1737400, 1737400);
  const tilingScheme = new GeographicTilingScheme({ ellipsoid, numberOfLevelZeroTilesX: 2, numberOfLevelZeroTilesY: 1 });
  const availability = new TileAvailability(tilingScheme, maximumLevel);
  for (let level = 0; level <= maximumLevel; level++) {
    availability.addAvailableTileRange(level, 0, 0, tilingScheme.getNumberOfXTilesAtLevel(level) - 1, tilingScheme.getNumberOfYTilesAtLevel(level) - 1);
  }
  let grid = admittedGrid, disposed = false, generatedTiles = 0, cancelledTiles = 0;
  // Pixel centers stop at ±89.875°. A pole is one geometric point: extending
  // a different edge-row height at each longitude would fold the native mesh.
  // Use the mean of the nearest source row for that single extrapolated vertex.
  // Native triangles interpolate the terminal cap; this is not measured detail.
  const poleMean = latitude => {
    let sum = 0;
    for (let column = 0; column < source.width; column++) sum += grid.sampleHeightMeters((column + .5) / 4, latitude).heightMeters;
    return sum / source.width;
  };
  const northPoleHeight = poleMean(89.875), southPoleHeight = poleMean(-89.875);
  const counts = {};
  const levelZeroError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(ellipsoid, width, 2);
  const valid = (x, y, level) => Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(level) && level >= 0 && level <= maximumLevel && x >= 0 && y >= 0 && x < tilingScheme.getNumberOfXTilesAtLevel(level) && y < tilingScheme.getNumberOfYTilesAtLevel(level);
  const abort = () => new DOMException('Lunar terrain request cancelled', 'AbortError');
  const provider = {
    tilingScheme, availability, errorEvent: new Event(),
    credit: new Credit('NASA / GSFC / LRO LOLA · LDEM_4 V3.0 · coarse 7.58 km terrain; no vertical exaggeration'),
    hasWaterMask: false, hasVertexNormals: false,
    getLevelMaximumGeometricError(level) { return levelZeroError / 2 ** level; },
    getTileDataAvailable(x, y, level) { return !disposed && valid(x, y, level); },
    loadTileDataAvailability() { return undefined; },
    requestTileGeometry(x, y, level, request) {
      if (disposed || signal?.aborted || request?.cancelled) { cancelledTiles++; return Promise.reject(abort()); }
      if (!valid(x, y, level)) return Promise.reject(new RangeError('No source terrain above LOLA LOD3 or outside geographic extent'));
      // A microtask permits native request cancellation before allocating a tile.
      return Promise.resolve().then(() => {
        if (disposed || signal?.aborted || request?.cancelled) { cancelledTiles++; throw abort(); }
        const rect = tilingScheme.tileXYToRectangle(x, y, level);
        const tile = grid.sampleTile(CMath.toDegrees(rect.west), CMath.toDegrees(rect.south), CMath.toDegrees(rect.east), CMath.toDegrees(rect.north), width, width);
        if (y === 0) tile.heights.fill(northPoleHeight, 0, width);
        if (y === tilingScheme.getNumberOfYTilesAtLevel(level) - 1) tile.heights.fill(southPoleHeight, width * (width - 1));
        generatedTiles++; counts[level] = (counts[level] || 0) + 1;
        return new HeightmapTerrainData({ buffer: tile.heights, width, height: width, childTileMask: level < maximumLevel ? 15 : 0, structure: { heightScale: 1, heightOffset: 0 } });
      });
    },
    diagnostics() {
      return { sourceId: source.id, sourceSha256: source.files[0].sha256, referenceFrame: source.mapReferenceFrame, referenceRadiusMeters: 1737400,
        sourceResolutionMeters: source.sourceResolutionMeters, maximumSourceLevel: maximumLevel, tileWidth: width,
        generatedTiles, cancelledTiles, levelCounts: { ...counts }, disposed,
        verticalExaggeration: 1, sourceGridBytes: disposed ? 0 : 2073600,
        polarCaps: { measured: false, method: 'Each exact pole uses the mean of its nearest source latitude row; native terminal triangles interpolate this extrapolated cap.', sourceEdgeLatitudeDegrees: 89.875, northHeightMeters: northPoleHeight, southHeightMeters: southPoleHeight },
        refinement: 'Native Cesium LOD/culling; descendants beyond source LOD3 may only upsample existing coarse geometry, never acquire finer data.' };
    },
    dispose() { if (!disposed) { disposed = true; grid = null; signal?.removeEventListener('abort', onAbort); } },
  };
  const onAbort = () => provider.dispose();
  if (signal?.aborted) provider.dispose();
  else signal?.addEventListener('abort', onAbort, { once: true });
  return provider;
}
