import { bvToRgb } from '../adapters/bvToRgb'
import { encodeEphTileNuniq } from '../adapters/ephCodec'
import { hipGetPix } from '../adapters/hipGetPix'
import { listRuntimeStarsFromTiles } from '../adapters/starsList'
import { nuniqToHealpixOrderAndPix } from '../adapters/starsNuniq'
import {
	buildStarsSurveyLoadPlan,
	type StarsRuntimeSurveyDefinition,
} from '../adapters/starsSurveyRegistry'
import { findRuntimeStarByHipInTiles } from '../adapters/starsLookup'
import type { RuntimeStar } from '../contracts/stars'
import type { SkyTilePayload } from '../contracts/tiles'
import {
	MODULE2_SIDE_BY_SIDE_BV_PROBES,
	MODULE2_SIDE_BY_SIDE_HIP_PROBES,
	MODULE2_SIDE_BY_SIDE_NUNIQ_PROBES,
	MODULE2_SIDE_BY_SIDE_SOURCE_REVISION,
} from './module2SideBySideReference.generated'

type Module2BvProbe = {
	readonly bv: number
	readonly expectedRgb: readonly [number, number, number]
}

type Module2NuniqProbe = {
	readonly order: number
	readonly pix: number
}

type Module2HipProbe = {
	readonly hip: number
	readonly expectedByOrder: {
		readonly 0: number
		readonly 1: number
		readonly 2: number
	}
}

type Module2StarsListProbe = {
	readonly id: string
	readonly source: string | null
	readonly maxMag?: number
	readonly hintOrderPix?: {
		readonly order: number
		readonly pix: number
	}
	readonly expectedStatus: 'ok' | 'again'
	readonly expectedStarIds: readonly string[]
}

type Module2SurveyPlanProbe = {
	readonly id: string
	readonly limitingMagnitude: number
	readonly observerFovDeg: number
	readonly activationFovDeg: number
	readonly fallbackMinVmag: number
	readonly expectedActivationFloor: number
	readonly expectedShouldActivateGaia: boolean
	readonly expectedOrderedKeys: readonly string[]
	readonly expectedActiveKeys: readonly string[]
}

type Module2LookupProbe = {
	readonly id: string
	readonly hip: number
	readonly expectedStarId: string | null
}

type Module2SideBySideReference = {
	readonly sourceRevision: string
	readonly bvProbes: readonly Module2BvProbe[]
	readonly nuniqProbes: readonly Module2NuniqProbe[]
	readonly hipProbes: readonly Module2HipProbe[]
	readonly starsListProbes: readonly Module2StarsListProbe[]
	readonly surveyPlanProbes: readonly Module2SurveyPlanProbe[]
	readonly lookupProbes: readonly Module2LookupProbe[]
}

type Module2CheckpointSection<TItem> = {
	readonly id: string
	readonly items: readonly TItem[]
}

type Module2BvCheckpointItem = {
	readonly bv: number
	readonly rgb: readonly [number, number, number]
}

type Module2NuniqCheckpointItem = {
	readonly order: number
	readonly pix: number
	readonly nuniq: string
	readonly decodedOrder: number
	readonly decodedPix: number
}

type Module2HipCheckpointItem = {
	readonly hip: number
	readonly byOrder: {
		readonly 0: number
		readonly 1: number
		readonly 2: number
	}
}

type Module2StarsListCheckpointItem = {
	readonly id: string
	readonly status: 'ok' | 'again'
	readonly starIds: readonly string[]
}

type Module2SurveyPlanCheckpointItem = {
	readonly id: string
	readonly activationFloor: number
	readonly shouldActivateGaia: boolean
	readonly orderedKeys: readonly string[]
	readonly activeKeys: readonly string[]
}

type Module2LookupCheckpointItem = {
	readonly id: string
	readonly hip: number
	readonly starId: string | null
}

export type Module2SideBySideHubCheckpoint = {
	readonly sourceRevision: string
	readonly bv: Module2CheckpointSection<Module2BvCheckpointItem>
	readonly nuniq: Module2CheckpointSection<Module2NuniqCheckpointItem>
	readonly hip: Module2CheckpointSection<Module2HipCheckpointItem>
	readonly starsList: Module2CheckpointSection<Module2StarsListCheckpointItem>
	readonly surveyPlan: Module2CheckpointSection<Module2SurveyPlanCheckpointItem>
	readonly lookup: Module2CheckpointSection<Module2LookupCheckpointItem>
}

export type Module2SideBySideMismatch = {
	readonly area: string
	readonly message: string
}

export type Module2SideBySideResult = {
	readonly hub: Module2SideBySideHubCheckpoint
	readonly reference: Module2SideBySideHubCheckpoint
	readonly mismatches: readonly Module2SideBySideMismatch[]
}

const SOURCE_REVISION = MODULE2_SIDE_BY_SIDE_SOURCE_REVISION

function q(value: number, decimals = 12): number {
	if (!Number.isFinite(value)) {
		return 0
	}
	const rounded = Number(value.toFixed(decimals))
	return rounded === 0 ? 0 : rounded
}

function qTriplet(rgb: readonly [number, number, number]): readonly [number, number, number] {
	return [q(rgb[0]), q(rgb[1]), q(rgb[2])] as const
}

function sortStrings(values: readonly string[]): readonly string[] {
	return values.slice().sort((left, right) => left.localeCompare(right))
}

function dedupeStrings(values: readonly string[]): readonly string[] {
	return Array.from(new Set(values))
}

function buildRuntimeStar(config: {
	readonly id: string
	readonly sourceId: string
	readonly raDeg: number
	readonly decDeg: number
	readonly mag: number
	readonly tier: `T${number}`
	readonly catalog: 'hipparcos' | 'gaia'
}): RuntimeStar {
	return {
		id: config.id,
		sourceId: config.sourceId,
		raDeg: config.raDeg,
		decDeg: config.decDeg,
		mag: config.mag,
		tier: config.tier,
		catalog: config.catalog,
	}
}

function buildStarsListTiles(): readonly SkyTilePayload[] {
	const rootHipStars: readonly RuntimeStar[] = [
		buildRuntimeStar({
			id: 'hip-bright',
			sourceId: 'HIP 1',
			raDeg: 10,
			decDeg: 10,
			mag: 1.1,
			tier: 'T0',
			catalog: 'hipparcos',
		}),
		buildRuntimeStar({
			id: 'hip-mid',
			sourceId: 'HIP 2',
			raDeg: 20,
			decDeg: 12,
			mag: 5.4,
			tier: 'T1',
			catalog: 'hipparcos',
		}),
		buildRuntimeStar({
			id: 'gaia-mixed',
			sourceId: 'Gaia DR3 1',
			raDeg: 22,
			decDeg: 13,
			mag: 6.2,
			tier: 'T2',
			catalog: 'gaia',
		}),
	]

	const childGaiaStars: readonly RuntimeStar[] = [
		buildRuntimeStar({
			id: 'gaia-1',
			sourceId: 'Gaia DR3 2',
			raDeg: 30,
			decDeg: 11,
			mag: 8.1,
			tier: 'T2',
			catalog: 'gaia',
		}),
		buildRuntimeStar({
			id: 'gaia-2',
			sourceId: 'Gaia DR3 3',
			raDeg: 35,
			decDeg: 14,
			mag: 9.2,
			tier: 'T2',
			catalog: 'gaia',
		}),
	]

	const mixedOrderStars: readonly RuntimeStar[] = [
		buildRuntimeStar({
			id: 'hip-too-faint',
			sourceId: 'HIP 2003',
			raDeg: 100,
			decDeg: 10,
			mag: 8.7,
			tier: 'T2',
			catalog: 'hipparcos',
		}),
		buildRuntimeStar({
			id: 'hip-ok-2',
			sourceId: 'HIP 2002',
			raDeg: 101,
			decDeg: 10,
			mag: 4.2,
			tier: 'T1',
			catalog: 'hipparcos',
		}),
		buildRuntimeStar({
			id: 'hip-ok-1',
			sourceId: 'HIP 2001',
			raDeg: 102,
			decDeg: 10,
			mag: 2.1,
			tier: 'T0',
			catalog: 'hipparcos',
		}),
	]

	const deepHipStars: readonly RuntimeStar[] = [
		buildRuntimeStar({
			id: 'hip-faint-a',
			sourceId: 'HIP 1001',
			raDeg: 10,
			decDeg: 10,
			mag: 9.1,
			tier: 'T2',
			catalog: 'hipparcos',
		}),
		buildRuntimeStar({
			id: 'hip-faint-b',
			sourceId: 'HIP 1002',
			raDeg: 11,
			decDeg: 11,
			mag: 10.2,
			tier: 'T2',
			catalog: 'hipparcos',
		}),
	]

	return [
		{
			tileId: 'root-hip',
			level: 0,
			parentTileId: null,
			childTileIds: ['child-gaia', 'mixed-order'],
			bounds: { raMinDeg: 0, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 90 },
			magMin: 0,
			magMax: 8,
			starCount: rootHipStars.length,
			stars: [...rootHipStars],
			provenance: {
				catalog: 'multi-survey',
				sourcePath: 'fixtures',
				sourceKey: 'hip-main',
				sourceKeys: ['hip-main'],
				hipsOrder: 0,
				hipsPix: 3,
				hipsTiles: [{ sourceKey: 'hip-main', order: 0, pix: 3 }],
			},
		},
		{
			tileId: 'child-gaia',
			level: 1,
			parentTileId: 'root-hip',
			childTileIds: [],
			bounds: { raMinDeg: 0, raMaxDeg: 90, decMinDeg: 0, decMaxDeg: 45 },
			magMin: 5,
			magMax: 12,
			starCount: childGaiaStars.length,
			stars: [...childGaiaStars],
			provenance: {
				catalog: 'gaia',
				sourcePath: 'gaia/Norder1/Npix5.eph',
				sourceKey: 'gaia',
				sourceKeys: ['gaia'],
				hipsOrder: 1,
				hipsPix: 5,
				hipsTiles: [
					{ sourceKey: 'gaia', order: 1, pix: 5 },
					{ sourceKey: 'gaia', order: 1, pix: 6 },
				],
			},
		},
		{
			tileId: 'mixed-order',
			level: 1,
			parentTileId: 'root-hip',
			childTileIds: ['deep-hip'],
			bounds: { raMinDeg: 90, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 45 },
			magMin: 1,
			magMax: 9,
			starCount: mixedOrderStars.length,
			stars: [...mixedOrderStars],
			provenance: {
				catalog: 'hipparcos',
				sourcePath: 'fixtures',
				sourceKey: 'hip-main',
				sourceKeys: ['hip-main'],
				hipsOrder: 1,
				hipsPix: 6,
				hipsTiles: [{ sourceKey: 'hip-main', order: 1, pix: 6 }],
			},
		},
		{
			tileId: 'deep-hip',
			level: 2,
			parentTileId: 'mixed-order',
			childTileIds: [],
			bounds: { raMinDeg: 90, raMaxDeg: 180, decMinDeg: 0, decMaxDeg: 45 },
			magMin: 8.5,
			magMax: 12,
			starCount: deepHipStars.length,
			stars: [...deepHipStars],
			provenance: {
				catalog: 'hipparcos',
				sourcePath: 'fixtures',
				sourceKey: 'hip-main',
				sourceKeys: ['hip-main'],
				hipsOrder: 2,
				hipsPix: 9,
				hipsTiles: [{ sourceKey: 'hip-main', order: 2, pix: 9 }],
			},
		},
	]
}

function buildLookupTiles(): readonly SkyTilePayload[] {
	return [
		{
			tileId: 'lookup-root',
			level: 0,
			parentTileId: null,
			childTileIds: [],
			bounds: { raMinDeg: 180, raMaxDeg: 360, decMinDeg: 0, decMaxDeg: 90 },
			magMin: 0,
			magMax: 7,
			starCount: 3,
			stars: [
				buildRuntimeStar({
					id: 'gaia-11767',
					sourceId: 'HIP 11767',
					raDeg: 37.954515,
					decDeg: 89.264109,
					mag: 2.1,
					tier: 'T1',
					catalog: 'gaia',
				}),
				buildRuntimeStar({
					id: 'hip-11767-a',
					sourceId: 'HIP 11767',
					raDeg: 37.954515,
					decDeg: 89.264109,
					mag: 2,
					tier: 'T0',
					catalog: 'hipparcos',
				}),
				buildRuntimeStar({
					id: 'hip-91262',
					sourceId: 'HIP 91262',
					raDeg: 279.234735,
					decDeg: 38.783689,
					mag: 0.03,
					tier: 'T0',
					catalog: 'hipparcos',
				}),
			],
			provenance: {
				catalog: 'multi-survey',
				sourcePath: 'lookup-fixture',
				sourceKey: 'hip-main',
				sourceKeys: ['hip-main'],
				hipsOrder: 0,
				hipsPix: 3,
			},
		},
	]
}

function buildSurveyDefinitions(): readonly StarsRuntimeSurveyDefinition<string>[] {
	return [
		{
			key: 'gaia',
			catalog: 'gaia',
			minVmag: 4,
			maxVmag: 20,
			sourceRecordCount: 2,
			loadTile: 'gaia-load',
		},
		{
			key: 'hip-main',
			catalog: 'hipparcos',
			minVmag: -2,
			maxVmag: 6.5,
			sourceRecordCount: 3,
			loadTile: 'hip-main-load',
		},
		{
			key: 'hip-deep',
			catalog: 'hipparcos',
			minVmag: 6.5,
			maxVmag: 9.2,
			sourceRecordCount: 4,
			loadTile: 'hip-deep-load',
		},
	]
}

function buildReferenceVectors(): Module2SideBySideReference {
	return {
		sourceRevision: SOURCE_REVISION,
		bvProbes: MODULE2_SIDE_BY_SIDE_BV_PROBES.map((probe) => ({
			bv: probe.bv,
			expectedRgb: [probe.expectedRgb[0], probe.expectedRgb[1], probe.expectedRgb[2]] as const,
		})),
		nuniqProbes: [
			...MODULE2_SIDE_BY_SIDE_NUNIQ_PROBES.map((probe) => ({
				order: probe.order,
				pix: probe.pix,
			})),
		],
		hipProbes: MODULE2_SIDE_BY_SIDE_HIP_PROBES.map((probe) => ({
			hip: probe.hip,
			expectedByOrder: {
				0: probe.expectedByOrder[0],
				1: probe.expectedByOrder[1],
				2: probe.expectedByOrder[2],
			},
		})),
		starsListProbes: [
			{
				id: 'default-hip-max6',
				source: null,
				maxMag: 6,
				expectedStatus: 'ok',
				expectedStarIds: ['hip-bright', 'hip-mid', 'hip-ok-2', 'hip-ok-1'],
			},
			{
				id: 'explicit-gaia-max9',
				source: 'gaia',
				maxMag: 9,
				expectedStatus: 'ok',
				expectedStarIds: ['gaia-1'],
			},
			{
				id: 'unknown-source-fallback',
				source: 'unknown-survey-key',
				maxMag: 6,
				expectedStatus: 'ok',
				expectedStarIds: ['hip-bright', 'hip-mid', 'hip-ok-2', 'hip-ok-1'],
			},
			{
				id: 'hint-miss-again',
				source: 'gaia',
				hintOrderPix: { order: 2, pix: 17 },
				expectedStatus: 'again',
				expectedStarIds: [],
			},
			{
				id: 'hint-hit-order1-pix5',
				source: 'gaia',
				hintOrderPix: { order: 1, pix: 5 },
				expectedStatus: 'ok',
				expectedStarIds: ['gaia-1', 'gaia-2'],
			},
			{
				id: 'hint-hit-order1-pix6-via-provenance-set',
				source: 'gaia',
				hintOrderPix: { order: 1, pix: 6 },
				expectedStatus: 'ok',
				expectedStarIds: ['gaia-1', 'gaia-2'],
			},
		],
		surveyPlanProbes: [
			{
				id: 'wide-fov-promoted-gaia',
				limitingMagnitude: 9.5,
				observerFovDeg: 70,
				activationFovDeg: 40,
				fallbackMinVmag: -2,
				expectedActivationFloor: 9.2,
				expectedShouldActivateGaia: true,
				expectedOrderedKeys: ['hip-main', 'hip-deep', 'gaia'],
				expectedActiveKeys: ['hip-main', 'hip-deep', 'gaia'],
			},
			{
				id: 'narrow-fov-gaia-active-without-promotion',
				limitingMagnitude: 5.2,
				observerFovDeg: 20,
				activationFovDeg: 40,
				fallbackMinVmag: -2,
				expectedActivationFloor: 9.2,
				expectedShouldActivateGaia: true,
				expectedOrderedKeys: ['hip-main', 'hip-deep', 'gaia'],
				expectedActiveKeys: ['hip-main', 'gaia'],
			},
			{
				id: 'wide-fov-no-gaia-activation-under-floor',
				limitingMagnitude: 6.1,
				observerFovDeg: 85,
				activationFovDeg: 40,
				fallbackMinVmag: -2,
				expectedActivationFloor: 9.2,
				expectedShouldActivateGaia: false,
				expectedOrderedKeys: ['hip-main', 'hip-deep', 'gaia'],
				expectedActiveKeys: ['hip-main'],
			},
		],
		lookupProbes: [
			{ id: 'lookup-hip-11767', hip: 11767, expectedStarId: 'hip-11767-a' },
			{ id: 'lookup-hip-91262', hip: 91262, expectedStarId: 'hip-91262' },
			{ id: 'lookup-hip-missing', hip: 9999999, expectedStarId: null },
		],
	}
}

function runBvCheckpoint(reference: Module2SideBySideReference): Module2CheckpointSection<Module2BvCheckpointItem> {
	return {
		id: 'module2-bv-side-by-side',
		items: reference.bvProbes.map((probe) => ({
			bv: probe.bv,
			rgb: qTriplet(bvToRgb(probe.bv)),
		})),
	}
}

function runNuniqCheckpoint(reference: Module2SideBySideReference): Module2CheckpointSection<Module2NuniqCheckpointItem> {
	return {
		id: 'module2-nuniq-side-by-side',
		items: reference.nuniqProbes.map((probe) => {
			const nuniq = encodeEphTileNuniq(probe.order, probe.pix)
			const decoded = nuniqToHealpixOrderAndPix(nuniq)
			return {
				order: probe.order,
				pix: probe.pix,
				nuniq: nuniq.toString(),
				decodedOrder: decoded.order,
				decodedPix: decoded.pix,
			}
		}),
	}
}

function runHipCheckpoint(reference: Module2SideBySideReference): Module2CheckpointSection<Module2HipCheckpointItem> {
	return {
		id: 'module2-hip-side-by-side',
		items: reference.hipProbes.map((probe) => ({
			hip: probe.hip,
			byOrder: {
				0: hipGetPix(probe.hip, 0),
				1: hipGetPix(probe.hip, 1),
				2: hipGetPix(probe.hip, 2),
			},
		})),
	}
}

function runStarsListCheckpoint(
	reference: Module2SideBySideReference,
	tiles: readonly SkyTilePayload[],
): Module2CheckpointSection<Module2StarsListCheckpointItem> {
	return {
		id: 'module2-stars-list-side-by-side',
		items: reference.starsListProbes.map((probe) => {
			const visited: string[] = []
			const hintNuniq = probe.hintOrderPix
				? encodeEphTileNuniq(probe.hintOrderPix.order, probe.hintOrderPix.pix)
				: undefined
			const status = listRuntimeStarsFromTiles({
				tiles,
				source: probe.source,
				maxMag: probe.maxMag,
				hintNuniq,
				visit: (star) => {
					visited.push(star.id)
				},
			})
			return {
				id: probe.id,
				status,
				starIds: [...visited],
			}
		}),
	}
}

function runSurveyPlanCheckpoint(
	reference: Module2SideBySideReference,
	surveys: readonly StarsRuntimeSurveyDefinition<string>[],
): Module2CheckpointSection<Module2SurveyPlanCheckpointItem> {
	return {
		id: 'module2-survey-plan-side-by-side',
		items: reference.surveyPlanProbes.map((probe) => {
			const clonedSurveys = surveys.map((survey) => ({ ...survey }))
			const plan = buildStarsSurveyLoadPlan({
				surveys: clonedSurveys,
				limitingMagnitude: probe.limitingMagnitude,
				observerFovDeg: probe.observerFovDeg,
				activationFovDeg: probe.activationFovDeg,
				fallbackMinVmag: probe.fallbackMinVmag,
			})
			return {
				id: probe.id,
				activationFloor: q(plan.activationFloorVmag),
				shouldActivateGaia: plan.shouldActivateGaia,
				orderedKeys: plan.orderedSurveys.map((survey) => survey.key),
				activeKeys: plan.activeSurveys.map((survey) => survey.key),
			}
		}),
	}
}

function runLookupCheckpoint(
	reference: Module2SideBySideReference,
	tiles: readonly SkyTilePayload[],
): Module2CheckpointSection<Module2LookupCheckpointItem> {
	return {
		id: 'module2-lookup-side-by-side',
		items: reference.lookupProbes.map((probe) => ({
			id: probe.id,
			hip: probe.hip,
			starId: findRuntimeStarByHipInTiles(tiles, probe.hip)?.id ?? null,
		})),
	}
}

export function computeModule2SideBySideHubCheckpoint(): Module2SideBySideHubCheckpoint {
	const reference = buildReferenceVectors()
	const starsListTiles = buildStarsListTiles()
	const lookupTiles = buildLookupTiles()
	const surveys = buildSurveyDefinitions()

	return {
		sourceRevision: reference.sourceRevision,
		bv: runBvCheckpoint(reference),
		nuniq: runNuniqCheckpoint(reference),
		hip: runHipCheckpoint(reference),
		starsList: runStarsListCheckpoint(reference, starsListTiles),
		surveyPlan: runSurveyPlanCheckpoint(reference, surveys),
		lookup: runLookupCheckpoint(reference, lookupTiles),
	}
}

export function computeModule2SideBySideReferenceCheckpoint(): Module2SideBySideHubCheckpoint {
	const reference = buildReferenceVectors()
	return {
		sourceRevision: reference.sourceRevision,
		bv: {
			id: 'module2-bv-side-by-side',
			items: reference.bvProbes.map((probe) => ({
				bv: probe.bv,
				rgb: qTriplet(probe.expectedRgb),
			})),
		},
		nuniq: {
			id: 'module2-nuniq-side-by-side',
			items: reference.nuniqProbes.map((probe) => {
				const nuniq = encodeEphTileNuniq(probe.order, probe.pix)
				const decoded = nuniqToHealpixOrderAndPix(nuniq)
				return {
					order: probe.order,
					pix: probe.pix,
					nuniq: nuniq.toString(),
					decodedOrder: decoded.order,
					decodedPix: decoded.pix,
				}
			}),
		},
		hip: {
			id: 'module2-hip-side-by-side',
			items: reference.hipProbes.map((probe) => ({
				hip: probe.hip,
				byOrder: probe.expectedByOrder,
			})),
		},
		starsList: {
			id: 'module2-stars-list-side-by-side',
			items: reference.starsListProbes.map((probe) => ({
				id: probe.id,
				status: probe.expectedStatus,
				starIds: [...probe.expectedStarIds],
			})),
		},
		surveyPlan: {
			id: 'module2-survey-plan-side-by-side',
			items: reference.surveyPlanProbes.map((probe) => ({
				id: probe.id,
				activationFloor: q(probe.expectedActivationFloor),
				shouldActivateGaia: probe.expectedShouldActivateGaia,
				orderedKeys: [...probe.expectedOrderedKeys],
				activeKeys: [...probe.expectedActiveKeys],
			})),
		},
		lookup: {
			id: 'module2-lookup-side-by-side',
			items: reference.lookupProbes.map((probe) => ({
				id: probe.id,
				hip: probe.hip,
				starId: probe.expectedStarId,
			})),
		},
	}
}

function compareNumber(
	area: string,
	leftLabel: string,
	rightLabel: string,
	left: number,
	right: number,
	mismatches: Module2SideBySideMismatch[],
): void {
	if (q(left) !== q(right)) {
		mismatches.push({
			area,
			message: `${leftLabel}=${q(left)} differs from ${rightLabel}=${q(right)}`,
		})
	}
}

function compareString(
	area: string,
	leftLabel: string,
	rightLabel: string,
	left: string,
	right: string,
	mismatches: Module2SideBySideMismatch[],
): void {
	if (left !== right) {
		mismatches.push({
			area,
			message: `${leftLabel}=${left} differs from ${rightLabel}=${right}`,
		})
	}
}

function compareStringArray(
	area: string,
	leftLabel: string,
	rightLabel: string,
	left: readonly string[],
	right: readonly string[],
	mismatches: Module2SideBySideMismatch[],
): void {
	const leftNormalized = sortStrings(dedupeStrings(left))
	const rightNormalized = sortStrings(dedupeStrings(right))
	if (leftNormalized.join('|') !== rightNormalized.join('|')) {
		mismatches.push({
			area,
			message: `${leftLabel}=[${leftNormalized.join(',')}] differs from ${rightLabel}=[${rightNormalized.join(',')}]`,
		})
	}
}

function compareBvSection(
	hub: Module2CheckpointSection<Module2BvCheckpointItem>,
	reference: Module2CheckpointSection<Module2BvCheckpointItem>,
	mismatches: Module2SideBySideMismatch[],
): void {
	for (let index = 0; index < Math.max(hub.items.length, reference.items.length); index += 1) {
		const hubItem = hub.items[index]
		const referenceItem = reference.items[index]
		if (!hubItem || !referenceItem) {
			mismatches.push({ area: 'bv', message: `probe length mismatch at index ${index}` })
			continue
		}
		compareNumber('bv', 'hub.bv', 'ref.bv', hubItem.bv, referenceItem.bv, mismatches)
		compareNumber('bv', 'hub.r', 'ref.r', hubItem.rgb[0], referenceItem.rgb[0], mismatches)
		compareNumber('bv', 'hub.g', 'ref.g', hubItem.rgb[1], referenceItem.rgb[1], mismatches)
		compareNumber('bv', 'hub.b', 'ref.b', hubItem.rgb[2], referenceItem.rgb[2], mismatches)
	}
}

function compareNuniqSection(
	hub: Module2CheckpointSection<Module2NuniqCheckpointItem>,
	reference: Module2CheckpointSection<Module2NuniqCheckpointItem>,
	mismatches: Module2SideBySideMismatch[],
): void {
	for (let index = 0; index < Math.max(hub.items.length, reference.items.length); index += 1) {
		const hubItem = hub.items[index]
		const referenceItem = reference.items[index]
		if (!hubItem || !referenceItem) {
			mismatches.push({ area: 'nuniq', message: `probe length mismatch at index ${index}` })
			continue
		}
		compareNumber('nuniq', 'hub.order', 'ref.order', hubItem.order, referenceItem.order, mismatches)
		compareNumber('nuniq', 'hub.pix', 'ref.pix', hubItem.pix, referenceItem.pix, mismatches)
		compareString('nuniq', 'hub.nuniq', 'ref.nuniq', hubItem.nuniq, referenceItem.nuniq, mismatches)
		compareNumber('nuniq', 'hub.decodedOrder', 'ref.decodedOrder', hubItem.decodedOrder, referenceItem.decodedOrder, mismatches)
		compareNumber('nuniq', 'hub.decodedPix', 'ref.decodedPix', hubItem.decodedPix, referenceItem.decodedPix, mismatches)
	}
}

function compareHipSection(
	hub: Module2CheckpointSection<Module2HipCheckpointItem>,
	reference: Module2CheckpointSection<Module2HipCheckpointItem>,
	mismatches: Module2SideBySideMismatch[],
): void {
	for (let index = 0; index < Math.max(hub.items.length, reference.items.length); index += 1) {
		const hubItem = hub.items[index]
		const referenceItem = reference.items[index]
		if (!hubItem || !referenceItem) {
			mismatches.push({ area: 'hip', message: `probe length mismatch at index ${index}` })
			continue
		}
		compareNumber('hip', 'hub.hip', 'ref.hip', hubItem.hip, referenceItem.hip, mismatches)
		compareNumber('hip', 'hub.o0', 'ref.o0', hubItem.byOrder[0], referenceItem.byOrder[0], mismatches)
		compareNumber('hip', 'hub.o1', 'ref.o1', hubItem.byOrder[1], referenceItem.byOrder[1], mismatches)
		compareNumber('hip', 'hub.o2', 'ref.o2', hubItem.byOrder[2], referenceItem.byOrder[2], mismatches)
	}
}

function compareStarsListSection(
	hub: Module2CheckpointSection<Module2StarsListCheckpointItem>,
	reference: Module2CheckpointSection<Module2StarsListCheckpointItem>,
	mismatches: Module2SideBySideMismatch[],
): void {
	for (let index = 0; index < Math.max(hub.items.length, reference.items.length); index += 1) {
		const hubItem = hub.items[index]
		const referenceItem = reference.items[index]
		if (!hubItem || !referenceItem) {
			mismatches.push({ area: 'stars-list', message: `probe length mismatch at index ${index}` })
			continue
		}
		compareString('stars-list', 'hub.id', 'ref.id', hubItem.id, referenceItem.id, mismatches)
		compareString('stars-list', 'hub.status', 'ref.status', hubItem.status, referenceItem.status, mismatches)
		compareStringArray('stars-list', 'hub.starIds', 'ref.starIds', hubItem.starIds, referenceItem.starIds, mismatches)
	}
}

function compareSurveyPlanSection(
	hub: Module2CheckpointSection<Module2SurveyPlanCheckpointItem>,
	reference: Module2CheckpointSection<Module2SurveyPlanCheckpointItem>,
	mismatches: Module2SideBySideMismatch[],
): void {
	for (let index = 0; index < Math.max(hub.items.length, reference.items.length); index += 1) {
		const hubItem = hub.items[index]
		const referenceItem = reference.items[index]
		if (!hubItem || !referenceItem) {
			mismatches.push({ area: 'survey-plan', message: `probe length mismatch at index ${index}` })
			continue
		}
		compareString('survey-plan', 'hub.id', 'ref.id', hubItem.id, referenceItem.id, mismatches)
		compareNumber('survey-plan', 'hub.activationFloor', 'ref.activationFloor', hubItem.activationFloor, referenceItem.activationFloor, mismatches)
		compareString(
			'survey-plan',
			'hub.shouldActivateGaia',
			'ref.shouldActivateGaia',
			String(hubItem.shouldActivateGaia),
			String(referenceItem.shouldActivateGaia),
			mismatches,
		)
		compareStringArray('survey-plan', 'hub.orderedKeys', 'ref.orderedKeys', hubItem.orderedKeys, referenceItem.orderedKeys, mismatches)
		compareStringArray('survey-plan', 'hub.activeKeys', 'ref.activeKeys', hubItem.activeKeys, referenceItem.activeKeys, mismatches)
	}
}

function compareLookupSection(
	hub: Module2CheckpointSection<Module2LookupCheckpointItem>,
	reference: Module2CheckpointSection<Module2LookupCheckpointItem>,
	mismatches: Module2SideBySideMismatch[],
): void {
	for (let index = 0; index < Math.max(hub.items.length, reference.items.length); index += 1) {
		const hubItem = hub.items[index]
		const referenceItem = reference.items[index]
		if (!hubItem || !referenceItem) {
			mismatches.push({ area: 'lookup', message: `probe length mismatch at index ${index}` })
			continue
		}
		compareString('lookup', 'hub.id', 'ref.id', hubItem.id, referenceItem.id, mismatches)
		compareNumber('lookup', 'hub.hip', 'ref.hip', hubItem.hip, referenceItem.hip, mismatches)
		compareString('lookup', 'hub.starId', 'ref.starId', String(hubItem.starId), String(referenceItem.starId), mismatches)
	}
}

export function runModule2SideBySideParityHarness(): Module2SideBySideResult {
	const hub = computeModule2SideBySideHubCheckpoint()
	const reference = computeModule2SideBySideReferenceCheckpoint()
	const mismatches: Module2SideBySideMismatch[] = []

	compareString('meta', 'hub.sourceRevision', 'ref.sourceRevision', hub.sourceRevision, reference.sourceRevision, mismatches)
	compareBvSection(hub.bv, reference.bv, mismatches)
	compareNuniqSection(hub.nuniq, reference.nuniq, mismatches)
	compareHipSection(hub.hip, reference.hip, mismatches)
	compareStarsListSection(hub.starsList, reference.starsList, mismatches)
	compareSurveyPlanSection(hub.surveyPlan, reference.surveyPlan, mismatches)
	compareLookupSection(hub.lookup, reference.lookup, mismatches)

	return {
		hub,
		reference,
		mismatches,
	}
}

function serializeBvSection(section: Module2CheckpointSection<Module2BvCheckpointItem>): string {
	return section.items
		.map((item) => `bv:${q(item.bv)}:${q(item.rgb[0])},${q(item.rgb[1])},${q(item.rgb[2])}`)
		.join('|')
}

function serializeNuniqSection(section: Module2CheckpointSection<Module2NuniqCheckpointItem>): string {
	return section.items
		.map((item) => `nq:${item.order}:${item.pix}:${item.nuniq}:${item.decodedOrder}:${item.decodedPix}`)
		.join('|')
}

function serializeHipSection(section: Module2CheckpointSection<Module2HipCheckpointItem>): string {
	return section.items
		.map((item) => `hip:${item.hip}:${item.byOrder[0]}:${item.byOrder[1]}:${item.byOrder[2]}`)
		.join('|')
}

function serializeStarsListSection(section: Module2CheckpointSection<Module2StarsListCheckpointItem>): string {
	return section.items
		.map((item) => `list:${item.id}:${item.status}:${item.starIds.join(',')}`)
		.join('|')
}

function serializeSurveyPlanSection(section: Module2CheckpointSection<Module2SurveyPlanCheckpointItem>): string {
	return section.items
		.map((item) => (
			`plan:${item.id}:${q(item.activationFloor)}:${item.shouldActivateGaia ? '1' : '0'}:` +
			`${item.orderedKeys.join(',')}:${item.activeKeys.join(',')}`
		))
		.join('|')
}

function serializeLookupSection(section: Module2CheckpointSection<Module2LookupCheckpointItem>): string {
	return section.items
		.map((item) => `lookup:${item.id}:${item.hip}:${item.starId ?? 'null'}`)
		.join('|')
}

export function computeModule2SideBySideParityDigest(result = runModule2SideBySideParityHarness()): string {
	return [
		`source:${result.hub.sourceRevision}`,
		`match:${result.mismatches.length === 0 ? '1' : '0'}`,
		`mismatches:${result.mismatches.length}`,
		serializeBvSection(result.hub.bv),
		serializeNuniqSection(result.hub.nuniq),
		serializeHipSection(result.hub.hip),
		serializeStarsListSection(result.hub.starsList),
		serializeSurveyPlanSection(result.hub.surveyPlan),
		serializeLookupSection(result.hub.lookup),
	].join('::')
}

export function summarizeModule2SideBySideParity(result = runModule2SideBySideParityHarness()): string {
	const mismatchSummary = result.mismatches.length
		? result.mismatches.slice(0, 8).map((mismatch) => `${mismatch.area}:${mismatch.message}`).join('||')
		: 'none'
	return [
		`source:${result.hub.sourceRevision}`,
		`sections:6`,
		`bv:${result.hub.bv.items.length}`,
		`nuniq:${result.hub.nuniq.items.length}`,
		`hip:${result.hub.hip.items.length}`,
		`list:${result.hub.starsList.items.length}`,
		`plan:${result.hub.surveyPlan.items.length}`,
		`lookup:${result.hub.lookup.items.length}`,
		`mismatches:${result.mismatches.length}`,
		`detail:${mismatchSummary}`,
	].join('|')
}
