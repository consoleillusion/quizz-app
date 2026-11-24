<script lang="ts">
// uPlot time-series chart: answered per bucket (bars, right axis), correct % per bucket and
// running correct % (lines, left axis, 0-100). Resizes with its container.
import { onMount } from "svelte"
import uPlot from "uplot"
import "uplot/dist/uPlot.min.css"

let { data, bucket } = $props()
let host: HTMLDivElement
let chart: uPlot | undefined

const colors = () => {
  // Purpose: the chart's colors from the page's wacss tokens, read from its own element so they follow the palette and mode
  const style = getComputedStyle(host)
  const faint = (percent: number) => `color-mix(in oklab, ${style.color} ${percent}%, transparent)`
  return {
    correct: style.getPropertyValue("--chart-1").trim(),
    running: style.getPropertyValue("--chart-2").trim(),
    answered: faint(35),
    axis: style.color,
    grid: faint(20),
  }
}

function options(width: number): uPlot.Options {
  // Purpose: chart options for the current width: series styling, axes and scales
  const c = colors()
  const axis = { stroke: c.axis, grid: { stroke: c.grid }, ticks: { stroke: c.grid } }
  return {
    width,
    height: heightFor(width),
    cursor: { points: { size: 6 } },
    legend: { live: true },
    scales: {
      x: { time: true },
      pct: { range: [0, 100] },
      n: { range: (_u, _min, max) => [0, Math.max(1, max) * 1.1] },
    },
    series: [
      {
        label: bucket === "hour" ? "Hour" : bucket === "week" ? "Week of" : "Day",
      },
      {
        label: "Answered",
        scale: "n",
        stroke: c.answered,
        fill: c.answered,
        paths: uPlot.paths.bars!({ size: [0.6, 40] }),
        points: { show: false },
      },
      {
        label: "Correct %",
        scale: "pct",
        stroke: c.correct,
        width: 2,
        spanGaps: false,
        value: (_u, v) => (v == null ? "–" : `${v}%`),
      },
      {
        label: "Running %",
        scale: "pct",
        stroke: c.running,
        width: 2,
        dash: [6, 4],
        value: (_u, v) => (v == null ? "–" : `${v}%`),
      },
    ],
    axes: [
      { ...axis },
      {
        ...axis,
        scale: "pct",
        values: (_u, ticks) => ticks.map(t => `${t}%`),
      },
      { ...axis, scale: "n", side: 1, grid: { show: false } },
    ],
  }
}

const heightFor = (width: number) =>
  // Purpose: chart height that shrinks with the width on phones, up to 320 px (uPlot sizes in pixels)
  Math.round(Math.min(320, Math.max(200, width * 0.6)))

function draw() {
  // Purpose: rebuild the chart for the current data, bucket size and width
  chart?.destroy()
  chart = new uPlot(
    options(host.clientWidth),
    [data.x, data.answered, data.accuracy, data.running],
    host
  )
}

$effect(() => {
  // Purpose: redraw whenever the data or bucket size changes
  void data
  void bucket
  if (host) draw()
})

onMount(() => {
  // Purpose: follow the container's width, and tear the chart down when the component goes away
  const observer = new ResizeObserver(() =>
    chart?.setSize({
      width: host.clientWidth,
      height: heightFor(host.clientWidth),
    })
  )
  observer.observe(host)
  // The palette and mode are attributes on <html>; redraw in the new colors when either changes.
  const recolor = new MutationObserver(draw)
  recolor.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode", "data-palette"] })
  const system = matchMedia("(prefers-color-scheme: light)")
  system.addEventListener("change", draw)
  return () => {
    observer.disconnect()
    recolor.disconnect()
    system.removeEventListener("change", draw)
    chart?.destroy()
  }
})
</script>

<div bind:this={host} class="chart" aria-label="Answers over time"></div>

<style>
  .chart { width: 100%; }
  .chart :global(.u-legend) { font-size: 0.85em; }
</style>
