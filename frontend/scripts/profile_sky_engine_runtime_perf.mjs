#!/usr/bin/env node
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const DEFAULT_URL = 'http://127.0.0.1:4173/sky-engine?debugTelemetry=1'
const DEFAULT_DURATION_MS = 12000
const SAMPLE_INTERVAL_MS = 300

function percentile(values, ratio) {
  if (values.length === 0) {
    return 0
  }
  const sorted = values.slice().sort((left, right) => left - right)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * ratio)))
  return sorted[index]
}

function average(values) {
  if (values.length === 0) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function asFixed(value, digits = 3) {
  return Number(value.toFixed(digits))
}

function summarizeSeries(values) {
  return {
    count: values.length,
    avg: asFixed(average(values)),
    p50: asFixed(percentile(values, 0.5)),
    p95: asFixed(percentile(values, 0.95)),
    max: asFixed(values.length === 0 ? 0 : Math.max(...values)),
  }
}

function resolveRepoRoot() {
  return path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
}

async function main() {
  const url = process.env.SKY_ENGINE_PROFILE_URL?.trim() || DEFAULT_URL
  const durationMs = Number(process.env.SKY_ENGINE_PROFILE_DURATION_MS ?? DEFAULT_DURATION_MS)
  const repoRoot = resolveRepoRoot()
  const artifactDir = path.resolve(repoRoot, '.cursor-artifacts/parity-compare')
  await fs.mkdir(artifactDir, { recursive: true })
  const artifactPath = path.resolve(artifactDir, 'module2-live-runtime-profile-2026-04-26.json')

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
    await page.waitForSelector('canvas[data-sky-engine-runtime-perf]', { timeout: 120000 })

    const startedAt = Date.now()
    const samples = []

    while (Date.now() - startedAt < durationMs) {
      const sample = await page.evaluate(() => {
        const canvas = document.querySelector('canvas[data-sky-engine-runtime-perf]')
        if (!(canvas instanceof HTMLCanvasElement)) {
          return null
        }
        const runtimePerfRaw = canvas.dataset.skyEngineRuntimePerf ?? null
        const sceneStateRaw = canvas.dataset.skyEngineSceneState ?? null
        const starMetricsRaw = canvas.dataset.skyEngineStarRenderMetrics ?? null
        if (!runtimePerfRaw) {
          return null
        }
        const runtimePerf = JSON.parse(runtimePerfRaw)
        return {
          atIso: new Date().toISOString(),
          runtimePerf,
          sceneState: sceneStateRaw ? JSON.parse(sceneStateRaw) : null,
          starRenderMetrics: starMetricsRaw ? JSON.parse(starMetricsRaw) : null,
        }
      })

      if (sample) {
        samples.push(sample)
      }
      await page.waitForTimeout(SAMPLE_INTERVAL_MS)
    }

    const frameTotalSeries = samples.map((sample) => Number(sample.runtimePerf?.latest?.frameTotalMs ?? 0))
    const sceneRenderSeries = samples.map((sample) => Number(sample.runtimePerf?.latest?.sceneRenderMs ?? 0))
    const projectionSeries = samples.map((sample) => {
      const projectedStars = Number(sample.runtimePerf?.latest?.stepMs?.collectProjectedStarsMs ?? 0)
      const projectedNonStars = Number(sample.runtimePerf?.latest?.stepMs?.collectProjectedNonStarObjectsMs ?? 0)
      return projectedStars + projectedNonStars
    })
    const starLayerSeries = samples.map((sample) => Number(sample.runtimePerf?.latest?.stepMs?.syncStarLayerMs ?? 0))
    const projectionShareSeries = samples.map((sample) => Number(sample.runtimePerf?.projectionShare ?? 0))
    const starsListVisitSeries = samples.map((sample) => Number(sample.sceneState?.starsListVisitCount ?? 0))
    const renderedStarSeries = samples.map((sample) => Number(sample.starRenderMetrics?.starThinInstanceCount ?? 0))

    const report = {
      capturedAtIso: new Date().toISOString(),
      url,
      durationMs,
      sampleIntervalMs: SAMPLE_INTERVAL_MS,
      sampleCount: samples.length,
      summary: {
        frameTotalMs: summarizeSeries(frameTotalSeries),
        sceneRenderMs: summarizeSeries(sceneRenderSeries),
        projectionMs: summarizeSeries(projectionSeries),
        syncStarLayerMs: summarizeSeries(starLayerSeries),
        projectionShare: summarizeSeries(projectionShareSeries),
        starsListVisitCount: summarizeSeries(starsListVisitSeries),
        starThinInstanceCount: summarizeSeries(renderedStarSeries),
      },
      lastSample: samples[samples.length - 1] ?? null,
      samples,
    }

    await fs.writeFile(artifactPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
    console.log(JSON.stringify({ artifactPath, sampleCount: samples.length }, null, 2))
  } finally {
    await browser.close()
  }
}

try {
  await main()
} catch (error) {
  console.error('[profile_sky_engine_runtime_perf] failed')
  console.error(error)
  process.exit(1)
}
