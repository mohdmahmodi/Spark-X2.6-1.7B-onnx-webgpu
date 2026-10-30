# Spark-X2.6-1.7B browser build: validation report

## Summary

| test | original (transformers) | browser build | pass |
|---|---|---|---|
| Logits in WebGPU: mean KL to bf16 (160 pos.) | INT4 weights in HF: 0.0731 | 0.0757 (adds 0.00085 vs INT4) | PASS |
| Greedy parity: first token same (50 prompts) | INT4 weights in HF: 40/50 | 39/50 | PASS |
| Greedy parity: mean tokens before divergence | INT4 weights in HF: 24.4 | 22.4 | PASS |
| GSM8K | bf16 75.7%, INT4 weights 72.7% | 72.7% | PASS |
| BFCL v3 simple function calling | bf16 76.5%, INT4 weights 52.5% | 52.5% | PASS |
| Needle in a haystack | bf16 100.0%, INT4 weights 100.0% | 100.0% | PASS |
| Features: thinking / multi-turn / tool calls | 6/6 | 8/8 | PASS |
| Stability: 30 min back-to-back | n/a | 0 errors, tok/s 102->102, GPU mem -505 MB | PASS |

Shipped build: `q4f16` on nvidia ampere (Chrome, WebGPU, static KV cache). All browser results come from the real page driven by headless Chrome (tests/run_browser.mjs); the page tokenizes with tokenizers.js + the official chat template, and its prompt ids were checked to equal transformers' on every task.

## 1. Next-token logits vs transformers

20 prompts x 8 positions (after the prompt, then teacher-forcing the bf16 greedy continuation).

| system | mean KL vs bf16 | p95 | max | top-1 vs bf16 | mean KL vs INT4 weights | top-1 vs INT4 |
|---|---|---|---|---|---|---|
| **browser q4f16 (shipped)** | 0.0757 | 0.3958 | 1.643 | 90.0% | 0.00085 | 99.4% |
| transformers bf16, int8 embedding lookup (as in the build) | 0.0007 | 0.0030 | 0.013 | 99.4% | 0.08851 | 90.6% |
| transformers fp32 | 0.0003 | 0.0016 | 0.003 | 100.0% | 0.08867 | 90.0% |
| transformers + official INT4 weights | 0.0731 | 0.4169 | 1.393 | 90.0% | 0.00000 | 100.0% |
| same ONNX graph, CPU onnxruntime | 0.0732 | 0.4082 | 1.487 | 90.0% | 0.00050 | 99.4% |

KL vs INT4 isolates what the ONNX/WebGPU build adds on top of the official quantization.

WebGPU kernels vs CPU kernels, same graph: mean KL 0.00028, max 0.0099, top-1 agree 100.0%.

## 2. Greedy output parity (50 prompts: chat, code, math, Chinese, tool calls; 128 tokens) vs transformers bf16

| system | first token same | identical 128-token outputs | mean tokens before divergence | median |
|---|---|---|---|---|
| browser q4 (fp32 activations) | 39/50 | 6/50 | 21.1 | 7 |
| **browser q4f16 (shipped)** | 39/50 | 6/50 | 22.4 | 7 |
| transformers + official INT4 weights | 40/50 | 6/50 | 24.4 | 8 |
| same ONNX graph, CPU onnxruntime | 39/50 | 6/50 | 21.1 | 7 |

Any 4-bit model drifts from bf16 at low-margin tokens; the INT4-weights row is the bar the browser build should meet.

Browser, mean matched tokens by category: chat 9, code 37, math 40, zh 6, tool 19

### Worst 5 divergences (shipped browser build)

**p10_chat** (Write a haiku about autumn leaves.): diverges after 0 tokens

| transformers bf16 | browser |
|---|---|
| Golden petals fall<br><br>Autumn's gentle grace | **Autumn**  <br>**Leaves**  <br>**Golden**  <br>**Fall** |

**p11_code** (Write a SQL query that returns the top 5 customers by total order amount from tables custo): diverges after 0 tokens

| transformers bf16 | browser |
|---|---|
| ```sql<br>SELECT <br>    c.id, <br>    c.name, <br>    SUM(o.amount) AS total_order_amount<br>FROM <br>    customers c<br>JOIN <br>    orders o ON c.id = o.customer_id | Here's the SQL query you need to get the top 5 customers by their total order amount:<br><br>```sql<br>SELECT <br>    c.id AS customer_id,<br>    c.name AS customer_name |

**p13_zh** (什么是机器学习？请简单解释。): diverges after 0 tokens

| transformers bf16 | browser |
|---|---|
| We need answer in Chinese. User asks: What is machine learning? Briefly explain. Need likely concise but informative. We need answer. Since thinking_effort high, but final should be concise. | 我们需要解释机器学习。用户要求简单解释。需要给出清晰、易懂、准确的定义，可能包括核心概念、特点、应用等。由于是中文回答，应该用中文。需要简洁但全面 |

**p14_tool** (Email alice@example.com and bob@example.com that the meeting moved to 3pm. Subject: Meetin): diverges after 0 tokens

| transformers bf16 | browser |
|---|---|
| <tool_call>send_email<arg_key>to</arg_key><arg_value>["alice@example.com", "bob@example.com"]</arg_value><arg_key>subject</arg_key><arg_value>Meeting update</arg_value><arg_key>body</arg_key><arg_value>The meeting has been moved to 3pm | **Email to Alice:**<br>- **Subject:** Meeting update<br>- **Body:** The meeting has been moved to 3pm.<br><br>**Email to Bob:**<br>- **Subject:** Meeting |

**p15_chat** (How do I make a cup of tea?): diverges after 0 tokens

| transformers bf16 | browser |
|---|---|
| *(Adjusting your tricorn hat with a flourish, the steam from your teapot swirling like a sea wave)*<br><br>Well now you've got the spirit of a true pirate! To make | *Arrr!* With a careful, rum-dry grip, I’d first gather a sturdy cup and a fine tea leaf—no rough ones, or the brew’s no good. |


## GSM8K, all 1319 test problems (thinking off, greedy, 768 tokens)

| system | score | vs INT4 weights: only-INT4-right / only-this-right, McNemar p |
|---|---|---|
| **browser q4f16 (shipped)** | 959/1319 (72.7%) | 38 / 38, p = 1.00 |
| transformers bf16 | 999/1319 (75.7%) | 88 / 128, p = 0.01 |
| transformers bf16, int8 embedding lookup (as in the build) | 988/1319 (74.9%) | 92 / 121, p = 0.05 |
| transformers + official INT4 weights | 959/1319 (72.7%) |  |

## GSM8K, first 200 (diagnostic runs)

| system | score | vs INT4 weights: only-INT4-right / only-this-right, McNemar p |
|---|---|---|
| **browser q4f16 (shipped)** | 147/200 (73.5%) | 5 / 4, p = 1.00 |
| transformers bf16 | 155/200 (77.5%) | 17 / 24, p = 0.35 |
| transformers + official INT4 weights | 148/200 (74.0%) |  |

## BFCL v3 simple function calling, first 200 (Spark tool format, SGLang spark25 parsing)

| system | score | vs INT4 weights: only-INT4-right / only-this-right, McNemar p |
|---|---|---|
| **browser q4f16 (shipped)** | 105/200 (52.5%) | 4 / 4, p = 1.00 |
| transformers bf16 | 153/200 (76.5%) | 3 / 51, p = 0.00 |
| transformers bf16, int8 embedding lookup (as in the build) | 162/200 (81.0%) | 2 / 59, p = 0.00 |
| transformers + official INT4 weights | 105/200 (52.5%) |  |

## Needle in a haystack, 1k-16k tokens, needle at start/middle/end

| system | score | vs INT4 weights: only-INT4-right / only-this-right, McNemar p |
|---|---|---|
| browser q4 (fp32 activations) | 12/12 (100.0%) |  |
| | 1024_start: ok, 1024_middle: ok, 1024_end: ok, 4096_start: ok, 4096_middle: ok, 4096_end: ok, 8192_start: ok, 8192_middle: ok, 8192_end: ok, 16384_start: ok, 16384_middle: ok, 16384_end: ok | |
| **browser q4f16 (shipped)** | 12/12 (100.0%) |  |
| | 1024_start: ok, 1024_middle: ok, 1024_end: ok, 4096_start: ok, 4096_middle: ok, 4096_end: ok, 8192_start: ok, 8192_middle: ok, 8192_end: ok, 16384_start: ok, 16384_middle: ok, 16384_end: ok | |
| transformers bf16 | 12/12 (100.0%) |  |
| | 1024_start: ok, 1024_middle: ok, 1024_end: ok, 4096_start: ok, 4096_middle: ok, 4096_end: ok, 8192_start: ok, 8192_middle: ok, 8192_end: ok, 16384_start: ok, 16384_middle: ok, 16384_end: ok | |
| transformers + official INT4 weights | 12/12 (100.0%) |  |
| | 1024_start: ok, 1024_middle: ok, 1024_end: ok, 4096_start: ok, 4096_middle: ok, 4096_end: ok, 8192_start: ok, 8192_middle: ok, 8192_end: ok, 16384_start: ok, 16384_middle: ok, 16384_end: ok | |

## Features (thinking, multi-turn, tool calls)

| check | transformers bf16 | browser |
|---|---|---|
| thinking on (high) | ok | ok |
| thinking on (low) | ok | ok |
| thinking off | ok | ok |
| multi-turn recall | ok | ok |
| tool call parses (spark25) | ok | ok |
| JS parser == Python parser | n/a | ok |
| answer uses tool result | ok | ok |
| KV prefix reuse == fresh prefill | n/a | ok |

Browser outputs:

- **thinking on (high)**: `We need answer simple. Need compute 15% of 80 = 0.15*80 = 12. Final number. Ensure no extra? User asks final number. We can just output 12.</think>12`
- **thinking on (low)**: `We need answer simple. 15% of 80 = 0.15*80 = 12. Final number 12. Need maybe just final.</think>12`
- **thinking off**: `15% of 80 = 0.15 × 80 = 12`
- **multi-turn recall**: `My cat is called Miso, and my favourite colour is teal.`
- **tool call parses (spark25)**: `<tool_call>get_weather<arg_key>city</arg_key><arg_value>Berlin</arg_value><arg_key>unit</arg_key><arg_value>celsius</arg_value></tool_call>`
- **JS parser == Python parser**: `[{"name": "get_weather", "arguments": {"city": "Berlin", "unit": "celsius"}}]`
- **answer uses tool result**: `The weather in Berlin right now is 18°C with light rain.`
- **KV prefix reuse == fresh prefill**: `reused 117 of 132 prompt tokens, 42/42 tokens identical, TTFT 71 -> 50 ms`

## Smaller GPU limits

`tests/run_browser.mjs --max-binding BYTES --max-buffer BYTES` gives the page a device with lower
`maxStorageBufferBindingSize` / `maxBufferSize` on the same GPU, a stand-in for phones and other GPUs with small limits
that were not available. Both runs below use WebGPU's defaults, 128 MiB per binding and 256 MiB per buffer, the
smallest limits a WebGPU device can have.

| device limits (binding / buffer) | variant | needle, 12 cases, 1k-16k | greedy parity, 50 prompts |
|---|---|---|---|
| 128 MiB / 256 MiB | q4f16 | 12/12 identical to the unrestricted run | 50/50 identical |
| 128 MiB / 256 MiB | q4 | 12/12 identical to the unrestricted q4 run | 50/50 identical |

- **Weights.** The largest tensor, the int8 embedding / LM head table, is 268,435,456 bytes, exactly the default
  `maxBufferSize`. onnxruntime-web binds it in pieces where the binding limit is 128 MiB. The loader used to require
  the binding limit to fit the table, which rejected devices that can run the model.
- **Activations.** onnxruntime-web's layer-norm kernels index their buffers directly instead of through the
  accessor that spans the pieces of a split buffer, so their output is zero past the first binding, without an
  error. This showed as all-zero output for the 4B's 16k prompts in fp32 at 128 MiB, and one-op models show it for
  `LayerNormalization`, `SimplifiedLayerNormalization`, `SkipLayerNormalization` and `SkipSimplifiedLayerNormalization`
  in 1.31.0-dev.20260918 (1.31.1 fixes the first two, not the Skip variants). Reported as [microsoft/onnxruntime#33755](https://github.com/microsoft/onnxruntime/issues/33755), with a fix for
  the Skip variants in [#33760](https://github.com/microsoft/onnxruntime/pull/33760). Here the fp32 hidden state `[S, 2048]`
  would pass 128 MiB at 16,385 tokens. Where the binding limit is small, the loader prefills in pieces that keep every
  activation, including the largest (the MLP intermediate `[S, 6656]`), within one binding (4,864 tokens for q4 and
  9,984 for q4f16 at 128 MiB). With this GPU's own limit (2 GiB per binding) nothing is split and the published results are
  unchanged (`browser_q4f16` rerun: 12/12 and 50/50 identical).


## Speed (RTX 3090 Ti, Chrome, q4f16, greedy, headless)

| measure | value |
|---|---|
| first visit: download (1.21 GB from a local server into the Cache API) + session init | 5.9 s + 1.4 s |
| later visits: load from cache + session init | 0.9 s + 0.7 s = 1.5 s |
| decode, 28-token prompt, 256 new tokens (tools/bench.mjs, warm runs) | 102-105 tok/s |
| decode at 28 / 1k / 4k / 8k / 16k tokens of context (256 new tokens, mean of the warm runs) | 108 / 104 / 107 / 109 / 107 tok/s |
| time to first token, 28 / 2,335 tokens (the first run after load adds about 0.3-0.6 s of shader compilation) | 50 ms / 0.62 s |
| time to first token, 1k / 4k / 8k / 16k tokens | 0.30 s / 1.16 s / 2.49 s / 5.92 s |
| next chat turn with KV prefix reuse (132-token prompt, 117 cached) | 50 ms vs 71 ms from scratch |
| Spark-X2.6-4B build, same machine, same night, same method: decode at 28 / 1k / 4k / 8k / 16k | 90 / 89 / 85 / 80 / 69 tok/s |
| Spark-X2.6-4B build: time to first token at 28 / 1k / 4k / 8k / 16k | 90 ms / 0.83 s / 2.86 s / 6.25 s / 15.05 s |

The context sweep uses the needle-in-a-haystack texts with the question replaced by a request for a detailed summary, so
every run decodes 256 tokens. Decode speed of this build hardly depends on context length: at this model size each
token's time is dominated by dispatching the per-layer kernels, not by attention over the cache.


## Stability (back-to-back generations)

- 877 generations, 163009 tokens in 30.0 min, 0 errors, page errors: 3
- decode tok/s (prompts < 1k tokens): first sixth 102.3, last sixth 101.6
- GPU memory used (whole GPU) after warm-up: 3873 MB -> 3368 MB (max 3879 MB)
- page JS heap after warm-up: 35 MB -> 35 MB; KV capacity 1024 tokens

## Transformers.js

The published files with the generated `config.json` (`model_type: "qwen3"`), loaded by Transformers.js 4.3.2 in
Chrome (`AutoModelForCausalLM`, `generate` with greedy decoding, `apply_chat_template` for the prompts), run through
the same suites as the app. Two runtimes: the onnxruntime-web build bundled with Transformers.js 4.3.2
(`1.31.0-dev.20260914`) and the app's `1.31.0-dev.20260918`, swapped in with an import map.

| check | bundled runtime | runtime 0918 |
|---|---|---|
| prompt ids, all suites | identical to Python transformers | identical |
| logits vs this build, 160 positions | mean KL 0.000000, top-1 1.000 | mean KL 0.000000, top-1 1.000 |
| greedy parity, 50 prompts | 50/50 identical to this build | 50/50 identical |
| BFCL, 200 cases | 105/200, 200/200 identical outputs | 105/200, 200/200 identical |
| GSM8K, first 200 problems | 147/200, 197/200 identical outputs (the other 3 diverge late and score the same) | not run |
| needle in a haystack, 12 cases | 9/12: every 16k case fails (`Buffer size (4290250000) exceeds the max buffer size limit`) | 12/12, identical outputs |
| `pipeline("text-generation")` as in the README, 10 chat prompts | 10/10 identical text | 10/10 identical text |

Decode speed, 256 new tokens, mean of the second and third run (Chrome, RTX 3090 Ti):

| context | this build (static KV cache) | Transformers.js, bundled runtime | Transformers.js, runtime 0918 |
|---|---|---|---|
| short prompt | 117.6 tok/s, first token 0.05 s | 99.3 tok/s, 0.05 s | 99.7 tok/s, 0.05 s |
| 1k tokens | 119.7 tok/s, 0.29 s | 90.4 tok/s, 0.36 s | 94.1 tok/s, 0.29 s |
| 4k tokens | 120.2 tok/s, 1.15 s | 27.7 tok/s, 2.86 s | 28.4 tok/s, 1.16 s |
| 8k tokens | 119.6 tok/s, 2.48 s | 22.6 tok/s, 9.60 s | 23.7 tok/s, 2.48 s |
| 16k tokens | 113.4 tok/s, 5.88 s | fails | 18.0 tok/s, 5.81 s |

Transformers.js grows the KV cache at every step. Switching this app to a growing cache (`?kv=dynamic`) slows it to
the same ~17 tok/s at 16k, so the gap comes from the cache handling, not from the graph.


## INT4 reference and the input embedding

The official INT4 checkpoint is untied: its input embedding stays bf16 and only the LM head is int8. `hf_int4` loads it
exactly that way. This build looks up input tokens in the int8 LM-head table instead (one tensor for both, saving a
512 MB table); `hf_emb8` measures that change alone on the bf16 model: mean KL 0.0007 to bf16, GSM8K 988 vs 999
(McNemar p = 0.28), BFCL 162 vs 153. The INT4 decoding used by both the reference and the export matches
compressed-tensors' own unpack and dequantize bit for bit on all 141 quantized tensors.

The official INT4 weights cost this model more than they cost the 4B (GSM8K 72.7% vs 75.7% bf16, BFCL 52.5% vs 76.5%).
On BFCL the INT4 model mostly answers in text where bf16 calls the tool (81 vs 35 of the failures); when it calls, its
arguments are as accurate as bf16's. The browser build is judged against the INT4 checkpoint, which it reproduces.

## WebAssembly (CPU) backend

`convert/export_onnx.py --plain-embedding` replaces `GatherBlockQuantized` (no kernel in the WebAssembly build that ships
with `onnxruntime-web/webgpu`) with Gather and dequantize ops on the same int8 table. That graph loads and runs on the
WASM backend: over the 160 logits positions it matches native CPU onnxruntime to mean KL 0.00001 (top-1 identical) and
the INT4 checkpoint to 0.0005. Decode runs at 1.3 to 1.8 tok/s with 16 threads in a cross-origin isolated page, with
`accuracy_level` 0 or 4 and with either the `ort.wasm` or `ort.webgpu` bundle. Native onnxruntime runs the same graph at
41 tok/s with `accuracy_level` 4 (int8 activations) and 1.4 tok/s with level 0: the WebAssembly build has no fast
4-bit matmul kernel. No WASM variant is shipped.

## Not tested

- **Other GPUs / Mac / Android**: only an RTX 3090 Ti on Windows 11 + Chrome was available.
- **Thinking-on benchmarks**: GSM8K/BFCL were run with thinking off (thinking on/off behaviour is covered by the feature checks).
- **Two app tabs in one browser**: not retried for this build; on the 4B two WebGPU sessions in one Chrome GPU process hit
  `CreateDescriptorHeap E_OUTOFMEMORY` (device lost) on this machine.

