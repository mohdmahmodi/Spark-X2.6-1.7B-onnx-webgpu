// Numbers shown on the benchmarks page.
//
// MODELS / QUALITY / ALL_BENCHMARKS: reported by XHToken for the original Spark-X2.6-1.7B, from the model card
// (huggingface.co/XHToken/Spark-X2.6-1.7B, images/all_benchmark.svg, revision f18c032c), with Spark-X2.6-4B as their
// reference column. Thinking mode, high effort. "*" marks scores XHToken took from other models' published cards;
// null means not reported.
//
// Everything else was measured on this build: docs/VALIDATION.md and export/tests/results/decode_vs_context.json.

export const MODELS = ["Spark-X2.6-1.7B", "Spark-X2.5-1.7B", "Qwen3.5-2B", "Gemma4-E2B", "MiniCPM5-2B", "LFM2.5-2.6B", "Spark-X2.6-4B"];
export const MODEL_PARAMS = ["1.7B", "1.7B", "2.3B", "5.1B (2.3B)", "2.5B", "2.7B", "4.1B"];
export const REFERENCE = 6; // Spark-X2.6-4B: XHToken's reference column, greyed and never ranked
// bar colors from XHToken's own charts, so the figures read the same as the model card; grey for the reference
export const MODEL_COLORS = ["#f87d19", "#ffdd71", "#2959d3", "#bedcf7", "#858a91", "#c4c4c4", "var(--ref-bar)"];

export const QUALITY = [
  { name: "BFCL-V4", task: "Function calling", scores: [55.2, 46.9, 43.6, 36.6, 66.6, 61.1, 71.8] },
  { name: "τ³-bench Banking", task: "General agent", scores: [21.3, 20.1, 4.1, 8.8, 20.8, 7.1, 34.7] },
  { name: "MCP-Atlas", task: "MCP tool use", scores: [41.8, 23.4, 14.8, 12.6, 32.2, 3.0, 62.4] },
  { name: "BrowseComp", task: "Web browsing", scores: [41.7, 29.7, 3.1, 3.7, 23.4, 16.6, 53.1] },
  { name: "PAgentBench", task: "Personal assistant", scores: [58.8, 51.1, 34.9, 32.8, 59.5, null, 74.1] },
  { name: "SWE Pro", task: "Software engineering", scores: [26.7, 10.4, 1.9, null, 14.4, 0.6, 54.3] },
  { name: "HLE with tools", task: "Expert-level knowledge", scores: [19.9, 6.9, 5.7, 6.6, 15.1, 5.9, 36.9] },
  { name: "AA-LCR v1.1", task: "Long-context reasoning", scores: [48.0, 42.3, 21.0, 16.3, 59.3, 5.7, 67.3] },
];

export const ALL_BENCHMARKS = [
  ["Average", [["Average", "49.6", "35.8", "22.0", "22.5", "46.9", "30.4", "63.3"]]],
  ["Agent", [
    ["BFCL-V4", "55.2", "46.9", "43.6*", "36.6*", "66.6*", "61.1*", "71.8"],
    ["τ²-bench", "85.3", "65.3", "48.8*", "24.5*", "82.2", "69.7", "86.9"],
    ["τ³-bench Banking", "21.3", "20.1", "4.1", "8.8", "20.8*", "7.1", "34.7"],
    ["VitaBench 2.0", "22.6", "8.3", "5.2", "4.4", "3.4", "3.7", "30.8"],
    ["MCP-Atlas", "41.8", "23.4", "14.8", "12.6", "32.2", "3.0", "62.4"],
    ["EnterpriseOps-Gym", "26.1", "10.5", "6.8", "8.6", "14.8", null, "33.6"],
    ["ClawEval-EN", "66.9", "57.9", "47.7", "53.1*", "58.4", "62.9*", "69.9"],
    ["BrowseComp", "41.7", "29.7", "3.1", "3.7", "23.4", "16.6", "53.1"],
    ["SWebBench", "53.9", "31.6", "22.8", "15.6", "45.7", null, "71.7"],
    ["PAgentBench", "58.8", "51.1", "34.9", "32.8", "59.5", null, "74.1"],
  ]],
  ["Code", [
    ["SWE Pro", "26.7", "10.4", "1.9", null, "14.4*", "0.6*", "54.3"],
    ["SWE Verified", "59.8", "28.3", "6.8", null, "46.4*", "6.0*", "62.8"],
    ["SWE Multilingual", "57.3", "23.3", "5.0", null, "23.7", "5.3", "64.7"],
    ["SciCode", "20.1", "18.2", "6.0", "20.5", "26.3*", "14.2*", "36.8"],
  ]],
  ["Math", [
    ["Gaokao 2026 (of 150)", "118.9", "114.8", "94.0", "81.8", "107.9", "93.8", "134.9"],
    ["AIME 2026", "70.1", "69.4", "30.8", "37.5*", "86.5*", "45.2*", "91.2"],
    ["HMMT Feb 26", "48.8", "48.4", "21.5", "20.5", "63.8*", "33.7*", "81.3"],
    ["IMO-AnswerBench", "47.1", "45.4", null, "22.6", "63.9", "41.2", "75.2"],
  ]],
  ["Long context", [
    ["AA-LCR v1.1", "48.0", "42.3", "21.0*", "16.3*", "59.3*", "5.7*", "67.3"],
    ["LongBench v2", "40.4", "33.2", "38.7*", "20.5", "43.7*", "30.3*", "53.3"],
    ["Graphwalks BFS 256k F1", "85.1", "28.6", "60.2", "42.5", "71.1", "27.0", "92.2"],
    ["Graphwalks BFS 1M F1", "25.7", "3.0", "7.7", null, null, null, "34.2"],
    ["OpenAI MRCR v2 256k–512k", "56.1", "4.8", "16.9", null, null, null, "65.6"],
    ["OpenAI MRCR v2 512k–1M", "19.9", "0.9", "6.0", null, null, null, "26.0"],
  ]],
  ["General and knowledge", [
    ["IFEval", "89.4", "89.5", "78.6*", "34.8", "86.7*", "93.4*", "93.6"],
    ["IFBench", "65.5", "66.3", "41.3*", "22.7", "66.3*", "59.2*", "75.8"],
    ["HLE without tools", "8.7", "6.3", "2.1", "2.5", "8.9*", "6.2*", "17.9"],
    ["HLE with tools", "19.9", "6.9", "5.7", "6.6", "15.1", "5.9", "36.9"],
    ["GPQA", "51.3", "43.8", "44.6", "43.8", "55.1", "60.7", "69.9"],
    ["GPQA Diamond", "56.1", "46.8", "58.5", "43.4*", "70.2*", "55.8*", "77.1"],
  ]],
];

export const SYSTEMS = [
  { key: "bf16", name: "Original model, bf16" },
  { key: "int4", name: "Official INT4 weights" },
  { key: "web", name: "This build", ours: true },
];

export const ACCURACY = [
  { name: "GSM8K", detail: "1,319 problems", n: 1319, bf16: 999, int4: 959, web: 959 },
  { name: "BFCL v3 function calling", detail: "200 cases", n: 200, bf16: 153, int4: 105, web: 105 },
  { name: "Needle in a haystack", detail: "12 cases, 1k to 16k tokens", n: 12, bf16: 12, int4: 12, web: 12, count: true },
];

// check, transformers bf16, transformers INT4, this build
export const SUMMARY = [
  ["GSM8K", "75.7%", "72.7%", "72.7%"],
  ["BFCL v3 function calling", "76.5%", "52.5%", "52.5%"],
  ["Needle in a haystack", "12/12", "12/12", "12/12"],
  ["Next-token KL divergence to bf16", "0", "0.0731", "0.0757"],
  ["Greedy parity, first token, 50 prompts", "50/50", "40/50", "39/50"],
  ["Thinking, multi-turn and tool calls", "6/6", "", "8/8"],
  ["30-minute soak test", "", "", "0 errors"],
];

export const DECODE = [[28, 107.92], [1015, 103.77], [4087, 107.48], [8183, 108.71], [16375, 106.73]]; // context tokens, tok/s (mean of 2 runs)
export const FIRST_TOKEN = [[28, 0.0487], [1015, 0.3], [2335, 0.618], [4087, 1.16], [8183, 2.49], [16375, 5.92]]; // prompt tokens, s (median)

// decode tok/s by prompt length, this build and the Spark-X2.6-4B build, same page, GPU and measurement
export const SIZES = [
  { label: "28 tokens", detail: "short prompt", values: [107.92, 90.26] },
  { label: "1k tokens", detail: "", values: [103.77, 88.97] },
  { label: "4k tokens", detail: "", values: [107.48, 85.34] },
  { label: "8k tokens", detail: "", values: [108.71, 79.73] },
  { label: "16k tokens", detail: "", values: [106.73, 69.05] },
];

export const FIGURES = [
  ["Decode speed", "105", "tok/s", "107 tok/s at 16k tokens of context"],
  ["First token", "49", "ms", "618 ms for a 2,335-token prompt"],
  ["GSM8K", "72.7", "%", "Official INT4 model: 72.7%"],
  ["Download", "1.21", "GB", "Cached after the first visit"],
];
