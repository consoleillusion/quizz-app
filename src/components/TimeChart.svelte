<script lang="ts">
  // uPlot time-series chart: answered per bucket (bars, right axis), correct % per bucket and
  // running correct % (lines, left axis, 0-100). Resizes with its container.
  import {onMount} from "svelte"
  import uPlot from "uplot"
  import "uplot/dist/uPlot.min.css"

  let {data, bucket} = $props()
  let host: HTMLDivElement
  let chart: uPlot | undefined

  // Mid-greys and saturated lines read on both the light and dark themes.
  const colors = {correct: "#2e9e5b", running: "#5b7fd6", answered: "rgba(128, 128, 128, 0.35)", axis: "#888", grid: "rgba(128, 128, 128, 0.2)"}
  const axis = {stroke: colors.axis, grid: {stroke: colors.grid}, ticks: {stroke: colors.grid}}

  function options(width: number): uPlot.Options {
    // Purpose: chart options for the current width: series styling, axes and scales
    return {
      width, height: 320,
      cursor: {points: {size: 6}},
      legend: {live: true},
      scales: {x: {time: true}, pct: {range: [0, 100]}, n: {range: (_u, _min, max) => [0, Math.max(1, max) * 1.1]}},
      series: [
        {label: bucket === "hour" ? "Hour" : bucket === "week" ? "Week of" : "Day"},
        {label: "Answered", scale: "n", stroke: colors.answered, fill: colors.answered, paths: uPlot.paths.bars!({size: [0.6, 40]}), points: {show: false}},
        {label: "Correct %", scale: "pct", stroke: colors.correct, width: 2, spanGaps: false, value: (_u, v) => (v == null ? "–" : `${v}%`)},
        {label: "Running %", scale: "pct", stroke: colors.running, width: 2, dash: [6, 4], value: (_u, v) => (v == null ? "–" : `${v}%`)},
      ],
      axes: [
        {...axis},
        {...axis, scale: "pct", values: (_u, ticks) => ticks.map(t => `${t}%`)},
        {...axis, scale: "n", side: 1, grid: {show: false}},
      ],
    }
  }

  function draw() {
    // Purpose: rebuild the chart for the current data, bucket size and width
    chart?.destroy()
    chart = new uPlot(options(host.clientWidth), [data.x, data.answered, data.accuracy, data.running], host)
  }

  $effect(() => {
    // Purpose: redraw whenever the data or bucket size changes
    void data; void bucket
    if (host) draw()
  })

  onMount(() => {
    // Purpose: follow the container's width, and tear the chart down when the component goes away
    const observer = new ResizeObserver(() => chart?.setSize({width: host.clientWidth, height: 320}))
    observer.observe(host)
    return () => { observer.disconnect(); chart?.destroy() }
  })
</script>

<div bind:this={host} class="chart" aria-label="Answers over time"></div>

<style>
  .chart { width: 100%; }
  .chart :global(.u-legend) { font-size: 0.85em; }
</style>
