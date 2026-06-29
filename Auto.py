"""
generate_pipeline.py
====================
Batch generation pipeline for engineering incidents and problems.

RESUME BEHAVIOUR
----------------
Every generated artifact is written to disk immediately. On restart, any
step whose output file already exists on disk is skipped automatically.
The progress log is printed so you always know exactly where you are.

To force a full re-run of one topic, delete its pkg_root directory:
    rm -rf data/incidents/the-zombie-thread-memory-leak

To force a single step, delete just that file:
    rm data/incidents/the-zombie-thread-memory-leak/plan/algorithms.md

CONTEXT OVERFLOW FIX
---------------------
The LANGUAGE_PROMPT previously concatenated all 5 plan docs, which easily
blew up the context window on small local models. It now receives trimmed
summaries (TRIM_CHARS characters each) of the upstream docs, with only the
architecture doc sent in full (it is the most critical for code generation).
Adjust TRIM_CHARS to tune for your model's context size.

USAGE
-----
    python Auto.py                    # normal run with resume
    python Auto.py --dry-run          # show what would be generated
    python Auto.py --force            # regenerate everything (ignore cache)
    python Auto.py --topic 3          # generate only topic #3
    python Auto.py --list             # list all topics with status
"""

import argparse
import re
import json
import subprocess
import sys
import time
import traceback
from pathlib import Path
from typing import Optional
import litellm

# ==========================================
# 0. TOPICS
# ==========================================
TOPICS = [
    # ── Classic Systems ────────────────────────────────────────────────────────
    {
        "idea": "The Zombie Thread Memory Leak",
        "info": (
            "Possible causes\n"
            "instantiating new thread pools inside method execution loop\n"
            "missing executor shutdown method calls\n"
            "thread lifecycle outliving ephemeral parent client context"
        ),
    },
    {
        "idea": "The Midnight Clock Strike Double Booking",
        "info": (
            "Possible causes\n"
            "comparing localized string dates directly with UTC database records\n"
            "missing daylight saving time DST offset transition calculations\n"
            "overlapping interval matrix validation mismatch"
        ),
    },
    {
        "idea": "The Gluttonous In Memory Log Stream",
        "info": (
            "Possible causes\n"
            "loading raw multi-gigabyte file completely into a byte array\n"
            "missing chunked processing stream buffer configuration\n"
            "heap space exhausted during monolithic string split arrays"
        ),
    },
    {
        "idea": "The Poison Pill Queue Consumer Staller",
        "info": (
            "Possible causes\n"
            "immediate message reject causing instant automated front-of-queue re-queueing\n"
            "missing max-retry dead letter queue DLQ dispatch logic\n"
            "uncaught parsing exception crash looping consumer thread"
        ),
    },
    {
        "idea": "The Accumulating Audit Log Heap Leak",
        "info": (
            "Possible causes\n"
            "static in-memory global data structure maps holding records forever\n"
            "missing item time-to-live TTL eviction policies\n"
            "unbounded append-only historical tracking buffers without capacity limits"
        ),
    },

    # ── AI / ML Inference ─────────────────────────────────────────────────────
    {
        "idea": "The Phantom Gradient Descent Divergence",
        "info": (
            "Possible causes\n"
            "NaN propagation through weight tensors after learning rate spike\n"
            "gradient accumulation buffer not zeroed between batch iterations\n"
            "mixed-precision underflow causing silent zero weights in deeper layers"
        ),
    },
    {
        "idea": "The Stale Embedding Cache Poisoning",
        "info": (
            "Possible causes\n"
            "serving feature vectors from expired model version after hot-swap\n"
            "cache key collision between different model embeddings\n"
            "race condition during online learning cache invalidation"
        ),
    },
    {
        "idea": "The Tokenizer Boundary Collision",
        "info": (
            "Possible causes\n"
            "BPE tokenizer splitting multibyte UTF-8 across token boundaries incorrectly\n"
            "off-by-one in context window position encoding causing shifted attention\n"
            "batch inference padding token leaking into logits computation"
        ),
    },
    {
        "idea": "The Rogue Inference Batch Amplifier",
        "info": (
            "Possible causes\n"
            "dynamic batch size doubling without memory ceiling check\n"
            "incomplete batch causing partial tensor shape mismatch on GPU\n"
            "result aggregation concatenating tensors along wrong axis"
        ),
    },

    # ── Blockchain / Distributed Ledger ───────────────────────────────────────
    {
        "idea": "The Double Spend Race Condition",
        "info": (
            "Possible causes\n"
            "concurrent UTXO selection allowing same output spent in parallel blocks\n"
            "missing mempool lock during transaction replacement RBF\n"
            "block validation running after state commit instead of before"
        ),
    },
    {
        "idea": "The Merkle Tree Tamper Evasion",
        "info": (
            "Possible causes\n"
            "hash concatenation order inconsistency between node and verifier\n"
            "depth-first proof generation creating path with missing sibling hashes\n"
            "intermediate node caching serving stale proof after leaf mutation"
        ),
    },
    {
        "idea": "The Smart Contract Reentrancy Cascade",
        "info": (
            "Possible causes\n"
            "state update happening after external call instead of before\n"
            "nested callback draining funds across multiple contract calls\n"
            "fallback function invoking victim before balance check completes"
        ),
    },

    # ── Edge Computing / IoT ──────────────────────────────────────────────────
    {
        "idea": "The Fog Node Partition Healer",
        "info": (
            "Possible causes\n"
            "split-brain detection triggering both halves to elect self as leader\n"
            "gossip protocol message amplification causing network storm\n"
            "clock drift across edge nodes corrupting causal ordering"
        ),
    },
    {
        "idea": "The Sensor Fusion Drift Spiral",
        "info": (
            "Possible causes\n"
            "kalman filter covariance matrix becoming singular after长时间 idle\n"
            "accelerometer bias not compensated during gyroscope saturation\n"
            "timestamp misalignment causing prediction step using future measurement"
        ),
    },
    {
        "idea": "The Latency Sensitive Inference Flip Flop",
        "info": (
            "Possible causes\n"
            "model switching between edge and cloud based on stale latency probe\n"
            "hysteresis missing causing continuous flip-flop between compute tiers\n"
            "partial result discarded on tier switch mid-inference pipeline"
        ),
    },

    # ── Real-Time Streaming ───────────────────────────────────────────────────
    {
        "idea": "The Watermark Overtake Catastrophe",
        "info": (
            "Possible causes\n"
            "event time watermark advancing past buffered late-arriving events\n"
            "windowed aggregation emitting results before watermark close\n"
            "out-of-order events causing downstream state corruption"
        ),
    },
    {
        "idea": "The Exactly-Once Phantom Duplicate",
        "info": (
            "Possible causes\n"
            "transactional producer ack arriving after consumer commit\n"
            "idempotency key collision between unrelated events\n"
            "offset commit racing with rebalance causing replayed delivery"
        ),
    },
    {
        "idea": "The Backpressure Avalanche",
        "info": (
            "Possible causes\n"
            "downstream consumer slowdown propagating upstream to source\n"
            "buffer overflow causing silent event dropping without alert\n"
            "recovery after backpressure causing burst amplification spike"
        ),
    },

    # ── CRDT / Collaborative Systems ──────────────────────────────────────────
    {
        "idea": "The Conflict Free Merge Paradox",
        "info": (
            "Possible causes\n"
            "LWW register losing concurrent updates due to clock skew\n"
            "OR-set element removed before concurrent add fully propagated\n"
            "delta-CRDT state diff causing cascading re-computation on join"
        ),
    },
    {
        "idea": "The Operational Transform Treachery",
        "info": (
            "Possible causes\n"
            "insert and delete transforming against wrong causal context\n"
            "cursor position not adjusted after concurrent range deletion\n"
            "history branching creating non-convergent document states"
        ),
    },

    # ── WebAssembly / Native Runtime ──────────────────────────────────────────
    {
        "idea": "The Wasm Memory Exhaustion Spiral",
        "info": (
            "Possible causes\n"
            "linear memory grow exceeding host limit without graceful fallback\n"
            "table element index out of bounds in indirect call dispatch\n"
            "stack overflow from recursive Wasm function without depth guard"
        ),
    },
    {
        "idea": "The JIT Compiler Deoptimization Trap",
        "info": (
            "Possible causes\n"
            "inline cache miss causing type pollution recompilation storm\n"
            "branch profile data misleading speculation into hot loop\n"
            "GC safepoint not reached causing mutator thread starvation"
        ),
    },

    # ── Autonomous Systems ────────────────────────────────────────────────────
    {
        "idea": "The Path Planning Oscillation Death Spiral",
        "info": (
            "Possible causes\n"
            "reciprocal velocity obstacle calculation flipping between two local minima\n"
            "costmap resolution too coarse causing zigzag near obstacle boundary\n"
            "control loop frequency mismatch between planner and actuator"
        ),
    },
    {
        "idea": "The Sensor Fusion Byzantine Failure",
        "info": (
            "Possible causes\n"
            "one faulty lidar injecting ghost obstacles into fused occupancy grid\n"
            "voting algorithm not excluding outlier sensor after repeated disagreement\n"
            "timestamp jitter causing fusion of stale and fresh measurements"
        ),
    },

    # ── Finance (already have some, add more) ─────────────────────────────────
    {
        "idea": "The Flash Crash Liquidity Vacuum",
        "info": (
            "Possible causes\n"
            "stop loss cascade triggering in thin orderbook depth\n"
            "market maker withdrawal amplifying price impact\n"
            "latency arbitrage exploiting stale quotes across venues"
        ),
    },
    {
        "idea": "The Options Greeks Recalculation Storm",
        "info": (
            "Possible causes\n"
            "implied volatility surface recalculation on every tick without caching\n"
            "gamma hedging feedback loop amplifying delta adjustments\n"
            "weekend theta decay applied to expired options causing negative balances"
        ),
    },

    # ── Quantum / Post-Quantum ────────────────────────────────────────────────
    {
        "idea": "The Quantum Key Distribution Intercept Race",
        "info": (
            "Possible causes\n"
            "eavesdropper detection threshold too lenient allowing partial key exposure\n"
            "basis reconciliation message ordering allowing man-in-the-middle\n"
            "error correction leaking syndrome information about raw key"
        ),
    },

    # ── Game / Simulation ─────────────────────────────────────────────────────
    {
        "idea": "The Deterministic Replay Desynchronization",
        "info": (
            "Possible causes\n"
            "floating point determinism violated by different CPU architectures\n"
            "random seed not captured at snapshot point causing divergent simulation\n"
            "physics tick rate not locked to fixed timestep causing tunneling"
        ),
    },

    # ── Cybersecurity ─────────────────────────────────────────────────────────
    {
        "idea": "The Certificate Revocation Chain Blind Spot",
        "info": (
            "Possible causes\n"
            "OCSP response caching serving stale non-revoked status\n"
            "CRL distribution point unreachable causing soft-fail open policy\n"
            "certificate transparency log entry missing for reissued cert"
        ),
    },
    {
        "idea": "The Side Channel Spectre Cascade",
        "info": (
            "Possible causes\n"
            "speculative execution reading kernel memory through branch predictor\n"
            "cache line eviction timing leaking cryptographic key bits\n"
            "spectre v2 retpoline bypass through indirect branch stack abuse"
        ),
    },
]

# ==========================================
# 1. CONFIGURATION
# ==========================================
ROOT        = Path.cwd()
DATA_ROOT   = ROOT / "data"
QUESTIONS_ROOT = DATA_ROOT / "questions"
INCIDENTS_ROOT = DATA_ROOT / "incidents"

OUTPUT_MODE  = "incident"   # "incident" | "problem"
LANGS        = ["python", "cpp"]

MODEL        = "openai/openai/gpt-oss-20b"
API_BASE     = "http://localhost:1234/v1"
TEMPERATURE  = 0

# How many characters to send from each upstream doc when building
# the LANGUAGE_PROMPT. Increase if your model has a large context window.
# The architecture doc is always sent in full — it is the most critical.
TRIM_CHARS   = 800

# How many times to retry a failed LLM call before giving up on a step.
LLM_RETRIES  = 3
LLM_RETRY_DELAY = 5  # seconds between retries

litellm.api_base = API_BASE
litellm.api_key  = "lm-studio"

LANG_MAP = {
    "python": {
        "ext":     "py",
        "harness": "testharness.py",
        "run":     "python3 tests/testharness.py",
    },
    "cpp": {
        "ext":     "cpp",
        "harness": "testharness.cpp",
        "run":     "g++ -std=c++17 src/*.cpp tests/testharness.cpp -o harness && ./harness",
    },
    "java": {
        "ext":     "java",
        "harness": "TestHarness.java",
        "run":     "javac src/*.java tests/TestHarness.java && java -cp src:tests TestHarness",
    },
    "rust": {
        "ext":     "rs",
        "harness": "testharness.rs",
        "run":     "rustc src/main.rs tests/testharness.rs -o harness && ./harness",
    },
    "go": {
        "ext":     "go",
        "harness": "testharness_test.go",
        "run":     "go test ./...",
    },
}

# ==========================================
# 2. PLANNING PROMPTS
# ==========================================

DESCRIPTION_PROMPT = """\
You are a senior engineering challenge designer creating a 20-minute incident debugging challenge.

Write a concise, plain-Markdown description document for the following production incident concept.
This document will be consumed by downstream AI agents building the actual code.

Challenge concept:
{full_idea}

Output format — plain Markdown only. No JSON. No code fences around the document itself.

Include:
- ## Challenge Overview
- ## Engineering Context
- ## Core Failure Mode
- ## Candidate Objective (debug first, optimize second)
- ## Constraints

CRITICAL: Every challenge MUST have EXACTLY:
- 2 bugs to find and fix (one logic error, one subtle concurrency/correctness issue)
- 1 optimization target (O(n²) -> O(n log n) or similar)
- The bugs must be planted in separate files or separate functions so the candidate has to reason across the codebase.

Under Constraints, you MUST include ALL of these exact rules:
- Zero external dependencies. No pip packages, no npm packages, no crates, no jars beyond the language standard library.
- No databases of any kind — not SQLite, not Redis, not Postgres, not anything. All state is plain in-memory data structures (lists, dicts, sets, classes).
- No web frameworks. No FastAPI, Flask, Express, Spring, etc. This is NOT a web service.
- No message queues. No Kafka, RabbitMQ, SQS, Celery, etc.
- Cloud Run is ONLY the execution environment (an ephemeral container that runs code). It is NOT a deployment architecture. There is no API gateway, no routing, no HTTP endpoints.
- The code is a pure library / module that gets imported and called by a test harness. Nothing more.
- The test harness MUST output clear PASS/FAIL for each test case.

Be precise and terse. No filler.\
"""

ARCHITECTURE_PROMPT = """\
You are a senior engineering challenge designer.

Design a lightweight implementation architecture for this challenge.

ABSOLUTE RULES (violate any of these and the output is wrong):
- ZERO dependencies. Nothing outside the language standard library. Not SQLite. Not pytz. Not anything.
- NO databases. All state lives in plain in-memory data structures: Python lists, dicts, sets, custom classes. That's it.
- NO web frameworks. No FastAPI, Flask, etc. This is a library, not a service.
- NO message queues. Simulate a queue with a plain list and a threading.Lock if needed.
- Cloud Run = ephemeral container that executes code. It is NOT a deployment target. There is no API gateway, no HTTP layer, no routing.
- The architecture is: a few source files under src/ that define classes and functions. A test harness under tests/ imports them and runs assertions. That is the ENTIRE architecture.

ALLOWED (examples of what IS ok):
- Python: threading, concurrent.futures, queue, datetime, collections, dataclasses, typing
- C++: std::thread, std::mutex, std::vector, std::map, std::chrono, std::queue
- Custom classes that simulate domain objects (Booking, LogEntry, AuditRecord, etc.)
- In-memory lists/dicts acting as fake storage

FORBIDDEN (examples of what is NEVER ok):
- SQLite (even "in-memory" SQLite) — use a dict or list instead
- pytz, zoneinfo — use manual UTC offset arithmetic if timezone logic is needed
- FastAPI, Flask, httpx, requests — no HTTP at all
- Redis, Kafka, Celery — no external services
- numpy, pandas — no third-party packages
- Any pip/cargo/npm/maven package whatsoever

Challenge Description:
{description_md}

Output format — plain Markdown only.

Include:
- ## System Components (plain classes/functions, no frameworks)
- ## Data Structures (exact Python/C++ types — e.g. "list of dicts", "dict mapping id->Booking")
- ## Concurrency Model (if any — use only stdlib threading primitives)
- ## File Layout (just filenames under src/, no more than 3-4 files)
- ## Intentional Bugs (describe TWO concrete bugs to plant — do not implement yet)
- ## Optimization Targets

Keep it tiny. 3-4 source files max. No boilerplate.\
"""

ALGORITHM_PROMPT = """\
You are a senior engineering challenge designer.

Describe the key algorithms and data flow for this challenge.
Focus on logic the candidate must reason through to find the bugs.

Challenge Description (summary):
{description_summary}

System Architecture:
{architecture_md}

Output format — plain Markdown only.

Include:
- ## Core Algorithms (step-by-step)
- ## Bug Locations (where each bug lives and how it manifests)
- ## Edge Cases (at least five)
- ## Invariants to Verify\
"""

INVARIANTS_PROMPT = """\
You are a senior engineering challenge designer.

Define strict correctness invariants for this challenge.
These will be used to write tests and verify candidate submissions.

Challenge Description (summary):
{description_summary}

Architecture (summary):
{architecture_summary}

Algorithms:
{algorithm_md}

Output format — plain Markdown only.

Include:
- ## Functional Invariants
- ## State Invariants
- ## Bug Regression Invariants (one per planted bug)
- ## Performance Invariants

Number each invariant: INV-1, INV-2, …\
"""

TESTING_PROMPT = """\
You are a senior engineering challenge designer designing tests for a 20-minute incident debugging challenge.

Tests must distinguish a buggy implementation from a correct one.
The test harness will run these tests and report PASS/FAIL to the candidate.

Challenge Description (summary):
{description_summary}

Architecture (summary):
{architecture_summary}

Algorithms (summary):
{algorithm_summary}

Invariants:
{invariants_md}

Output format — plain Markdown only.

Include:
- ## Bug Regression Tests (CRITICAL — one per planted bug; these must FAIL on the buggy code and PASS after the fix)
  - For each bug, describe: test name, input, expected correct output, what the buggy code actually produces
- ## Basic Test Cases (table: input → expected output for normal operation)
- ## Edge Case Tests (empty input, single element, boundary values, overflow)
- ## Stress Tests (lightweight, e.g. 1000 ops — expose O(n²) performance issues)
- ## Test Data Shape (what testcases.json / testedgecases.json arrays look like)

IMPORTANT: Bug regression tests are the most important. They must be designed so that:
1. They clearly FAIL when run against the buggy code (with a meaningful error message)
2. They clearly PASS when run against the fixed code
3. Each test targets ONE specific bug — don't combine multiple bugs in one test\
"""

LANGUAGE_PROMPT = """\
You are a senior engineering challenge designer.

Write {lang}-specific implementation guidance for this challenge.
A code-generation agent will use this document to build the actual {lang} source files.

Challenge Description (summary):
{description_summary}

Architecture:
{architecture_md}

Algorithms (summary):
{algorithm_summary}

Test Strategy (summary):
{testing_summary}

Output format — plain Markdown only.

Include:
- ## Language-Specific Idioms ({lang} stdlib types and patterns to use — NO third-party packages)
- ## File Structure (exact filenames under src/ — bare filenames only, NO "src/" prefix in the filename itself)
- ## Class and Function Signatures (precise, with types)
- ## Bug Implementation Notes (how to plant each bug naturally in {lang})
- ## Test Harness Notes (how to load testcases.json and invoke the implementation)
- ## Pitfalls (common {lang} mistakes to avoid)

CRITICAL: Filenames in src_files must be bare names like "service.py", "models.py", "booking.py" — NEVER "src/service.py". The src/ directory is handled by the build system.

Be {lang}-specific. Do not repeat generic architecture.\
"""

# ==========================================
# 3. HELPERS
# ==========================================

def trim(text: str, n: int = TRIM_CHARS) -> str:
    """Return first n characters of text with a truncation notice if cut."""
    if len(text) <= n:
        return text
    return text[:n] + f"\n\n[… truncated to {n} chars for context budget …]"


def llm_complete(prompt: str, step_label: str = "") -> str:
    """Call the LLM with automatic retries on failure."""
    for attempt in range(1, LLM_RETRIES + 1):
        try:
            resp = litellm.completion(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=TEMPERATURE,
            )
            return resp.choices[0].message.content.strip()
        except Exception as exc:
            label = f" [{step_label}]" if step_label else ""
            print(f"   ⚠️  LLM error{label} attempt {attempt}/{LLM_RETRIES}: {exc}")
            if attempt < LLM_RETRIES:
                time.sleep(LLM_RETRY_DELAY)
            else:
                raise


def strip_code_fences(text: str) -> str:
    """Strip markdown code fences — used only for JSON source-file responses."""
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z0-9_+\-]*\n", "", text)
    text = re.sub(r"\n```$", "", text)
    return text.strip()


def to_slug(text: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    cleaned = re.sub(r"-+", "-", cleaned).strip("-")
    return cleaned or "untitled"


def read_file(path: Path) -> str:
    return path.read_text(encoding="utf-8").strip()


def write_file(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content + "\n", encoding="utf-8")


def sanitize_src_filename(fname: str) -> str:
    """
    Strip any leading directory components the LLM might have included.
    The build system already places files under src/, so filenames must be bare.

    "src/service.py"   -> "service.py"
    "src/models.py"    -> "models.py"
    "service.py"       -> "service.py"
    "./src/foo.py"     -> "foo.py"
    """
    return Path(fname).name


def cached_step(path: Path, label: str, generate_fn) -> str:
    """
    Return already-generated content from disk, or call generate_fn() to
    produce it, write it to disk, and return it.

    This is the core of the resume mechanism: any file that already exists
    on disk is treated as complete and is never regenerated.
    """
    if path.exists():
        content = read_file(path)
        print(f"      ✓ [skip] {label} (already on disk)")
        return content

    print(f"      → [gen]  {label} ...")
    content = generate_fn()
    write_file(path, content)
    print(f"      ✓ [done] {label}")
    return content


# ==========================================
# 4. PLANNING PIPELINE
# ==========================================

def run_planning_pipeline(pkg_root: Path, full_idea: str) -> dict:
    """
    Sequential, dependency-ordered, Markdown-only planning pipeline.
    Every output is cached to disk; already-completed steps are skipped.
    Returns a dict of all markdown strings.
    """
    plan_root      = pkg_root / "plan"
    lang_plan_root = plan_root / "languages"
    plan_root.mkdir(parents=True, exist_ok=True)
    lang_plan_root.mkdir(parents=True, exist_ok=True)

    plans: dict = {}

    # ── 1. description ────────────────────────────────────────────────────────
    plans["description_md"] = cached_step(
        plan_root / "description.md",
        "plan/description.md",
        lambda: llm_complete(
            DESCRIPTION_PROMPT.format(full_idea=full_idea),
            "description",
        ),
    )

    # ── 2. architecture ───────────────────────────────────────────────────────
    plans["architecture_md"] = cached_step(
        plan_root / "architecture.md",
        "plan/architecture.md",
        lambda: llm_complete(
            ARCHITECTURE_PROMPT.format(
                description_md=plans["description_md"],
            ),
            "architecture",
        ),
    )

    # ── 3. algorithms ─────────────────────────────────────────────────────────
    plans["algorithm_md"] = cached_step(
        plan_root / "algorithms.md",
        "plan/algorithms.md",
        lambda: llm_complete(
            ALGORITHM_PROMPT.format(
                description_summary=trim(plans["description_md"]),
                architecture_md=plans["architecture_md"],   # full — most critical
            ),
            "algorithms",
        ),
    )

    # ── 4. invariants ─────────────────────────────────────────────────────────
    plans["invariants_md"] = cached_step(
        plan_root / "invariants.md",
        "plan/invariants.md",
        lambda: llm_complete(
            INVARIANTS_PROMPT.format(
                description_summary=trim(plans["description_md"]),
                architecture_summary=trim(plans["architecture_md"]),
                algorithm_md=plans["algorithm_md"],         # full — most critical
            ),
            "invariants",
        ),
    )

    # ── 5. tests ──────────────────────────────────────────────────────────────
    plans["testing_md"] = cached_step(
        plan_root / "tests.md",
        "plan/tests.md",
        lambda: llm_complete(
            TESTING_PROMPT.format(
                description_summary=trim(plans["description_md"]),
                architecture_summary=trim(plans["architecture_md"]),
                algorithm_summary=trim(plans["algorithm_md"]),
                invariants_md=plans["invariants_md"],       # full — most critical
            ),
            "tests",
        ),
    )

    # ── 6. language guides (only for configured LANGS) ────────────────────────
    plans["language_mds"] = {}
    for lang in LANGS:
        lang_md = cached_step(
            lang_plan_root / f"{lang}.md",
            f"plan/languages/{lang}.md",
            lambda lang=lang: llm_complete(
                LANGUAGE_PROMPT.format(
                    lang=lang,
                    description_summary=trim(plans["description_md"]),
                    architecture_md=plans["architecture_md"],   # full
                    algorithm_summary=trim(plans["algorithm_md"]),
                    testing_summary=trim(plans["testing_md"]),
                ),
                f"lang/{lang}",
            ),
        )
        plans["language_mds"][lang] = lang_md

    return plans


# ==========================================
# 5. INCIDENT GENERATION
# ==========================================

# Hardcoded prohibitions block — injected into every code-generation prompt
# to prevent the LLM from pulling in any dependency whatsoever.
_ZERO_DEP_BLOCK = """
HARD DEPENDENCY RULES — VIOLATING ANY OF THESE MAKES THE OUTPUT WRONG:
- ZERO third-party packages. No pip install, no npm install, no cargo add, no maven deps.
  ONLY the language standard library is allowed.
- NO SQLite. Not even "in-memory SQLite". Use a Python dict/list or C++ std::vector/std::map instead.
- NO pytz, zoneinfo, dateutil. Use manual UTC offset arithmetic (e.g., a dict mapping timezone->offset_hours).
- NO FastAPI, Flask, Django, Spring, Express, or any web framework. This is NOT an HTTP service.
- NO Redis, Kafka, RabbitMQ, Celery, SQS, or any message queue. Simulate a queue with a plain list.
- NO numpy, pandas, scipy, or any data/numerical library. Use built-in types only.
- NO prometheus-client, opentelemetry, or any observability library.
- Cloud Run is ONLY where the code runs (an ephemeral container). There is no API gateway, no routing,
  no HTTP endpoints, no request/response cycle. The code is a library imported by a test harness.
"""

_FILENAME_RULE_BLOCK = """
FILENAME RULES — VIOLATING ANY OF THESE WILL CAUSE A BUILD FAILURE:
- src_files keys must be BARE filenames ONLY: "service.py", "models.py", "booking.py"
- NEVER include a directory prefix: "src/service.py" is WRONG, "service.py" is CORRECT
- NEVER use absolute paths or relative paths with slashes
- The src/ directory is created by the build system — you only provide the filename
"""


def generate_incident(pkg_root: Path, full_idea: str, plans: dict) -> None:
    description_md = plans["description_md"]
    architecture_md = plans["architecture_md"]
    algorithm_md   = plans["algorithm_md"]
    invariants_md  = plans["invariants_md"]
    testing_md     = plans["testing_md"]
    language_mds   = plans["language_mds"]

    # ── Incident Report ───────────────────────────────────────────────────────
    incident_report_path = pkg_root / "IncidentReport.md"
    incident_report_md = cached_step(
        incident_report_path,
        "IncidentReport.md",
        lambda: llm_complete(
            f"""\
Write a polished Incident Report for a senior engineering candidate.
This is for a LeetCode-style debugging challenge: the candidate has 20 minutes
to find and fix 2 bugs, then optimize a slow path — before all systems go down.

### Description
{description_md}

### Architecture (summary)
{trim(architecture_md)}

### Algorithms (summary)
{trim(algorithm_md)}

### Invariants (summary)
{trim(invariants_md)}

Output format — plain Markdown only.

Required sections (in this exact order):
- # <Incident Title>  (short, dramatic — e.g. "The Phantom Gradient Descent Divergence")
- ## Severity  (one of: P0-Critical, P1-High, P2-Medium — with brief justification)
- ## Impact  (what breaks, who is affected, what the downstream consequences are)
- ## Timeline  (a 3-5 step chronological timeline of how the incident unfolded)
- ## Symptoms  (what operators would see in logs/metrics — be specific)
- ## Root Cause Analysis  (the technical explanation of WHY this happened)
- ## Your Mission  (debug first, optimize second — be specific about what to fix)
  - ### Bug 1: <name>  (describe the first bug, where it lives, how it manifests)
  - ### Bug 2: <name>  (describe the second bug, where it lives, how it manifests)
  - ### Optimization  (describe the performance problem and the target)
- ## Constraints  (must include: zero dependencies, no databases, no frameworks, library-only code, must complete in <5 seconds)

Write for a senior engineer. Be precise. No filler. Make it feel like a real incident.\
""",
            "incident-report",
        ),
    )

    # ── Challenge Config (for frontend) ───────────────────────────────────────
    challenge_config_path = pkg_root / "challenge.json"
    challenge_config = cached_step(
        challenge_config_path,
        "challenge.json",
        lambda: llm_complete(
            f"""\
You are designing the frontend configuration for a LeetCode-style incident challenge.

### Incident Report
{incident_report_md}

### Invariants (summary)
{trim(invariants_md)}

Return a single raw valid JSON object with this exact schema:
{{
  "timeLimitMinutes": 20,
  "difficulty": "Medium" | "Hard" | "Expert",
  "challengeType": "incident-debug",
  "tags": ["<tag1>", "<tag2>", ...],
  "scoring": {{
    "bug1Points": <int, 25-50>,
    "bug2Points": <int, 25-50>,
    "optimizationPoints": <int, 25-50>,
    "totalPoints": 100,
    "timeBonusMax": <int, 10-30>
  }},
  "bugs": [
    {{
      "id": "bug-1",
      "name": "<short descriptive name>",
      "file": "<which src/ file contains the bug>",
      "symptom": "<what the candidate would observe>",
      "hints": ["<hint 1>", "<hint 2>"]
    }},
    {{
      "id": "bug-2",
      "name": "<short descriptive name>",
      "file": "<which src/ file contains the bug>",
      "symptom": "<what the candidate would observe>",
      "hints": ["<hint 1>", "<hint 2>"]
    }}
  ],
  "optimization": {{
    "name": "<short descriptive name>",
    "file": "<which src/ file has the slow code>",
    "currentComplexity": "O(...)",
    "targetComplexity": "O(...)",
    "symptom": "<what the candidate would observe>"
  }}
}}

Rules:
- difficulty must reflect actual complexity: most challenges are Hard
- tags should be 3-6 relevant domain tags (e.g. "concurrency", "memory-leak", "threading", "ai-inference", "distributed-systems")
- bugs must be specific enough that the candidate knows WHERE to look
- hints should guide without giving away the answer
- scoring must add up to totalPoints

Output ONLY raw valid JSON. No markdown. No explanation.\
""",
            "challenge-config",
        ),
    )

    # Parse challenge config for metadata enrichment
    try:
        _challenge = json.loads(strip_code_fences(challenge_config))
    except json.JSONDecodeError:
        _challenge = {}

    manifest_files: dict = {}
    entry_points:   dict = {}

    # ── Per-language source generation ────────────────────────────────────────
    for lang in LANGS:
        l_info    = LANG_MAP.get(lang, LANG_MAP["python"])
        lang_plan = language_mds.get(lang, "")
        lang_root = pkg_root / "language" / lang
        src_dir   = lang_root / "src"
        tests_dir = lang_root / "tests"
        src_dir.mkdir(parents=True, exist_ok=True)
        tests_dir.mkdir(parents=True, exist_ok=True)

        # Sentinel file: if this exists, the whole lang block is done.
        lang_done_sentinel = lang_root / ".generated"
        if lang_done_sentinel.exists():
            print(f"      ✓ [skip] language/{lang}/ (already generated)")
            # Reload manifest data from disk for the final manifest write.
            src_entries = []
            for p in sorted(src_dir.iterdir()):
                if p.is_file():
                    src_entries.append({
                        "path": f"src/{p.name}",
                        "content": read_file(p),
                        "readonly": False,
                        "language": lang,
                    })
            entry_file = read_file(lang_root / ".entry_file") if (lang_root / ".entry_file").exists() else "service.py"
            entry_points[lang] = f"src/{entry_file}"
            manifest_files[lang] = src_entries + [
                {"path": "tests/testcases.json",      "content": read_file(tests_dir / "testcases.json")      if (tests_dir / "testcases.json").exists()      else "[]", "readonly": True, "language": lang},
                {"path": "tests/testedgecases.json",  "content": read_file(tests_dir / "testedgecases.json")  if (tests_dir / "testedgecases.json").exists()  else "[]", "readonly": True, "language": lang},
                {"path": "tests/testcase_generator.py","content": read_file(tests_dir / "testcase_generator.py") if (tests_dir / "testcase_generator.py").exists() else "", "readonly": True, "language": lang},
                {"path": f"tests/{l_info['harness']}", "content": read_file(tests_dir / l_info["harness"])     if (tests_dir / l_info["harness"]).exists()     else "", "readonly": True, "language": lang},
            ]
            continue

        print(f"      → [gen]  language/{lang}/ source files ...")

        COMPONENTS_PROMPT = f"""\
You are building a multi-file backend incident codebase for language: {lang}.

{_ZERO_DEP_BLOCK}
{_FILENAME_RULE_BLOCK}

### Incident Report (summary)
{trim(incident_report_md)}

### Architecture
{architecture_md}

### Algorithms (summary)
{trim(algorithm_md)}

### Invariants (summary)
{trim(invariants_md)}

### {lang.upper()} Language Guide
{lang_plan}

CRITICAL RULES:
- src/ files must contain REAL {lang} code with EXACTLY TWO bugs planted naturally.
- Do NOT fix the bugs — the candidate must find and fix them.
- The code must be realistic: proper class structure, type hints, docstrings.
- The bugs must be SUBTLE — not obvious typos. Think race conditions, off-by-one, logic errors, incorrect formulas.
- testcase_generator_script must write tests that EXPOSE the bugs (tests should FAIL on buggy code).
- The testharness MUST:
  1. Import from src/ correctly (use sys.path or relative imports as needed for {lang})
  2. Run each test case individually and print "[PASS] test_name" or "[FAIL] test_name: expected X got Y"
  3. At the end print a summary line: "RESULTS: X/Y tests passed"
  4. Exit with code 0 if all pass, code 1 if any fail
  5. Include at least 2 REGRESSION tests per bug that specifically catch each planted bug
  6. Include edge case tests (empty input, single element, boundary values)
  7. Include a STRESS test (e.g. 1000+ operations) that exposes performance issues
- Keep everything lightweight. Pure library code. No HTTP, no DB, no frameworks.
- Use ONLY the {lang} standard library. Zero third-party packages.

Return a single raw valid JSON object:
{{
  "src_files": {{
    "<filename.ext>": "<full source code with bugs planted>",
    "<filename2.ext>": "<full source code>"
  }},
  "entry_file": "<main entrypoint filename from src_files — bare name only, no path prefix>",
  "testcase_generator_script": "<complete runnable Python 3 script that writes tests/testcases.json and tests/testedgecases.json with test cases that expose the bugs>",
  "testharness": "<complete {lang} test runner that reads both JSON files, runs all tests, and prints PASS/FAIL for each>"
}}

Output ONLY raw valid JSON. No markdown. No explanation.\
"""

        raw = llm_complete(COMPONENTS_PROMPT, f"components/{lang}")
        try:
            payload = json.loads(strip_code_fences(raw))
        except json.JSONDecodeError as exc:
            print(f"      ❌ JSON parse failed for {lang}: {exc}. Using minimal fallback.")
            payload = {
                "src_files": {"service.py": f"# Fallback stub for {lang}\n"},
                "entry_file": "service.py",
                "testcase_generator_script": (
                    "import json, pathlib\n"
                    "pathlib.Path('tests').mkdir(exist_ok=True)\n"
                    "pathlib.Path('tests/testcases.json').write_text('[]')\n"
                    "pathlib.Path('tests/testedgecases.json').write_text('[]')\n"
                ),
                "testharness": f"# Fallback harness for {lang}\n",
            }

        src_entries = []
        for fname, fcontent in payload.get("src_files", {}).items():
            # Sanitize: strip any "src/" prefix the LLM might have included
            clean_fname = sanitize_src_filename(fname)
            if clean_fname != fname:
                print(f"         ⚠️  LLM returned path-prefixed filename '{fname}', sanitized to '{clean_fname}'")
            (src_dir / clean_fname).write_text(fcontent + "\n", encoding="utf-8")
            src_entries.append({
                "path": f"src/{clean_fname}",
                "content": fcontent,
                "readonly": False,
                "language": lang,
            })

        gen_script   = payload.get("testcase_generator_script", "")
        harness_code = payload.get("testharness", "")
        entry_file   = sanitize_src_filename(payload.get("entry_file", "service.py"))

        write_file(tests_dir / "testcase_generator.py", gen_script)
        write_file(tests_dir / l_info["harness"],        harness_code)
        write_file(lang_root / "run_tests.sh",           f"#!/bin/bash\n{l_info['run']}")
        write_file(lang_root / ".entry_file",            entry_file)

        print(f"      → [run]  testcase_generator.py for {lang} ...")
        try:
            subprocess.run(
                ["python3", "tests/testcase_generator.py"],
                cwd=lang_root,
                check=True,
                capture_output=True,
                timeout=30,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as e:
            stderr = e.stderr.decode().strip() if hasattr(e, "stderr") and e.stderr else str(e)
            print(f"      ⚠️  Generator failed: {stderr}. Writing empty fallbacks.")
            write_file(tests_dir / "testcases.json",     "[]")
            write_file(tests_dir / "testedgecases.json", "[]")

        testcases_json = read_file(tests_dir / "testcases.json")     if (tests_dir / "testcases.json").exists()     else "[]"
        testedge_json  = read_file(tests_dir / "testedgecases.json") if (tests_dir / "testedgecases.json").exists() else "[]"

        entry_points[lang]   = f"src/{entry_file}"
        manifest_files[lang] = src_entries + [
            {"path": "tests/testcases.json",       "content": testcases_json,  "readonly": True, "language": lang},
            {"path": "tests/testedgecases.json",   "content": testedge_json,   "readonly": True, "language": lang},
            {"path": "tests/testcase_generator.py","content": gen_script,      "readonly": True, "language": lang},
            {"path": f"tests/{l_info['harness']}", "content": harness_code,    "readonly": True, "language": lang},
        ]

        # Mark this lang block as fully done.
        write_file(lang_done_sentinel, "done")
        print(f"      ✓ [done] language/{lang}/")

    # ── Manifests ─────────────────────────────────────────────────────────────
    title_line = next(
        (ln.lstrip("# ").strip() for ln in incident_report_md.splitlines() if ln.startswith("# ")),
        "Untitled Incident",
    )

    # Extract tags and difficulty from challenge config
    tags = _challenge.get("tags", [])
    difficulty = _challenge.get("difficulty", "Hard")
    scoring = _challenge.get("scoring", {})
    bugs = _challenge.get("bugs", [])

    metadata = {
        "slug":               to_slug(title_line),
        "title":              title_line,
        "challengeType":      "incident-debug",
        "severity":           _challenge.get("severity", "P0"),
        "difficulty":         difficulty,
        "tags":               tags,
        "timeLimitMinutes":   _challenge.get("timeLimitMinutes", 20),
        "scoring":            scoring,
        "bugs":               bugs,
        "optimization":       _challenge.get("optimization", {}),
        "availableLanguages": LANGS,
        "defaultLanguage":    LANGS[0],
        "summary":            full_idea.splitlines()[0],
    }

    manifest = {
        "version":             2,
        "report":              incident_report_md,
        "challenge":           _challenge,
        "availableLanguages":  LANGS,
        "defaultLanguage":     LANGS[0],
        "entryFileByLanguage": entry_points,
        "filesByLanguage":     manifest_files,
    }

    write_file(pkg_root / "metadata.json", json.dumps(metadata, indent=2))
    write_file(pkg_root / "manifest.json", json.dumps(manifest, indent=2))

    # ── Solution Reference ────────────────────────────────────────────────────
    solution_path = pkg_root / "solution.json"
    cached_step(
        solution_path,
        "solution.json",
        lambda: llm_complete(
            f"""\
You are generating the REFERENCE SOLUTION for an incident challenge.
This is used for automated verification — NOT shown to candidates.

### Incident Report
{incident_report_md}

### Architecture (summary)
{trim(architecture_md)}

### Challenge Config
{challenge_config}

For each language in {LANGS}, provide the CORRECTED source code (bugs fixed, optimized).

Return a single raw valid JSON object:
{{
  "summary": "<1-2 sentence summary of what was wrong and how it was fixed>",
  "fixes": [
    {{
      "bugId": "bug-1",
      "description": "<what the fix was>",
      "filesChanged": ["<filename>"],
      "diff": "<unified diff or description of the change>"
    }},
    {{
      "bugId": "bug-2",
      "description": "<what the fix was>",
      "filesChanged": ["<filename>"],
      "diff": "<unified diff or description of the change>"
    }}
  ],
  "optimization": {{
    "description": "<what was optimized>",
    "filesChanged": ["<filename>"],
    "beforeComplexity": "O(...)",
    "afterComplexity": "O(...)"
  }},
  "solutions": {{
    "python": {{
      "<filename>": "<corrected full source code>"
    }},
    "cpp": {{
      "<filename>": "<corrected full source code>"
    }}
  }}
}}

Output ONLY raw valid JSON. No markdown. No explanation.\
""",
            "solution",
        ),
    )


# ==========================================
# 6. PROBLEM GENERATION
# ==========================================

def generate_problem(pkg_root: Path, idx: int, full_idea: str, plans: dict) -> None:
    description_md = plans["description_md"]
    architecture_md = plans["architecture_md"]
    algorithm_md   = plans["algorithm_md"]
    invariants_md  = plans["invariants_md"]
    testing_md     = plans["testing_md"]
    language_mds   = plans["language_mds"]

    # ── Question.md ───────────────────────────────────────────────────────────
    question_md = cached_step(
        pkg_root / "Question.md",
        "Question.md",
        lambda: llm_complete(
            f"""\
Write an algorithmic / system-optimization problem statement for a senior engineer candidate.

### Description
{description_md}

### Architecture (summary)
{trim(architecture_md)}

### Algorithms (summary)
{trim(algorithm_md)}

### Invariants (summary)
{trim(invariants_md)}

Output format — plain Markdown only.

Required sections:
- # <Problem Title>
- ## Background
- ## Problem Statement
- ## Input / Output Specification
- ## Constraints
- ## Examples
- ## Scoring\
""",
            "question",
        ),
    )

    # ── Per-language drivers ──────────────────────────────────────────────────
    last_payload: dict = {}
    for lang in LANGS:
        lang_plan = language_mds.get(lang, "")
        lang_dir  = pkg_root / "drivers" / lang
        ext       = LANG_MAP.get(lang, {}).get("ext", lang)

        driver_path    = lang_dir / f"driver.{ext}"
        signature_path = lang_dir / f"signature.{ext}"

        if driver_path.exists() and signature_path.exists():
            print(f"      ✓ [skip] drivers/{lang}/ (already on disk)")
            # Read for potential reuse of last_payload fields
            last_payload = {
                "driver":    read_file(driver_path),
                "signature": read_file(signature_path),
                "generator_script": read_file(pkg_root / "testcase_generator.py") if (pkg_root / "testcase_generator.py").exists() else "",
                "sample_inputs":    read_file(pkg_root / "testcases.txt")          if (pkg_root / "testcases.txt").exists()          else "",
                "sample_outputs":   read_file(pkg_root / "testcases_submission.txt") if (pkg_root / "testcases_submission.txt").exists() else "",
            }
            continue

        print(f"      → [gen]  drivers/{lang}/ ...")
        lang_dir.mkdir(parents=True, exist_ok=True)

        DRIVERS_PROMPT = f"""\
You are building an algorithmic question harness for language: {lang}.

{_ZERO_DEP_BLOCK}

### Problem Statement (summary)
{trim(question_md)}

### Architecture (summary)
{trim(architecture_md)}

### Algorithms (summary)
{trim(algorithm_md)}

### {lang.upper()} Language Guide
{lang_plan}

Return a single raw valid JSON object:
{{
  "driver": "<complete {lang} driver reading stdin, invoking the candidate function, and validating output>",
  "signature": "<boilerplate stub the candidate fills in, with correct signature and docstring>",
  "generator_script": "<runnable Python 3 script that prints stress-test inputs to stdout>",
  "sample_inputs": "<raw text for testcases.txt>",
  "sample_outputs": "<expected output lines for testcases_submission.txt>"
}}

Output ONLY raw valid JSON. No markdown. No explanation.\
"""
        raw = llm_complete(DRIVERS_PROMPT, f"driver/{lang}")
        try:
            last_payload = json.loads(strip_code_fences(raw))
        except json.JSONDecodeError as exc:
            print(f"      ❌ JSON parse failed for {lang} driver: {exc}. Using minimal fallback.")
            last_payload = {
                "driver":           f"# Fallback driver for {lang}\n",
                "signature":        f"# Fallback signature for {lang}\n",
                "generator_script": "import sys\nprint('1\\n1')\n",
                "sample_inputs":    "1\n1\n",
                "sample_outputs":   "1\n",
            }

        write_file(driver_path,    last_payload.get("driver", ""))
        write_file(signature_path, last_payload.get("signature", ""))
        print(f"      ✓ [done] drivers/{lang}/")

    # Shared test data — written from last lang's payload (generator is lang-agnostic).
    if not (pkg_root / "testcase_generator.py").exists():
        write_file(pkg_root / "testcase_generator.py",    last_payload.get("generator_script", ""))
        write_file(pkg_root / "testcases.txt",            last_payload.get("sample_inputs", ""))
        write_file(pkg_root / "testcases_submission.txt", last_payload.get("sample_outputs", ""))

    # ── metadata ──────────────────────────────────────────────────────────────
    title_line = next(
        (ln.lstrip("# ").strip() for ln in question_md.splitlines() if ln.startswith("# ")),
        "Untitled Problem",
    )
    metadata = {
        "displayOrder": idx,
        "slug":         to_slug(title_line),
        "name":         title_line,
        "difficulty":   "Hard",
        "description":  question_md,
    }
    write_file(pkg_root / "metadata.json", json.dumps(metadata, indent=2))


# ==========================================
# 7. PROGRESS DISPLAY
# ==========================================

def print_progress(idx: int, total: int, slug: str, mode: str) -> None:
    bar_len = 30
    filled  = int(bar_len * idx / total)
    bar     = "█" * filled + "░" * (bar_len - filled)
    print(f"\n[{bar}] {idx}/{total}  mode={mode}  topic={slug}")


def print_resume_status(topics: list, mode: str) -> None:
    """Print a table showing which topics are complete, partial, or pending."""
    root = INCIDENTS_ROOT if mode == "incident" else QUESTIONS_ROOT
    print("\n┌─ RESUME STATUS " + "─" * 50)
    for i, item in enumerate(topics, start=1):
        slug     = to_slug(item["idea"])
        pkg_root = root / slug
        if not pkg_root.exists():
            status = "⬜ pending"
        else:
            # Check for final manifest / metadata
            done_file = pkg_root / "metadata.json"
            plan_done = all(
                (pkg_root / "plan" / f).exists()
                for f in ["description.md", "architecture.md", "algorithms.md", "invariants.md", "tests.md"]
            )
            if done_file.exists() and plan_done:
                status = "✅ complete"
            else:
                status = "🔶 partial "
        print(f"│  [{i:02d}] {status}  {item['idea']}")
    print("└" + "─" * 66 + "\n")


# ==========================================
# 8. BATCH EXECUTION ENGINE
# ==========================================

def list_topics(mode: str = OUTPUT_MODE) -> None:
    """Print numbered list of all topics with current status."""
    root = INCIDENTS_ROOT if mode == "incident" else QUESTIONS_ROOT
    print(f"\n{'─'*70}")
    print(f"  {'#':>3}  {'Status':^9}  {'Idea'}")
    print(f"{'─'*70}")
    for i, item in enumerate(TOPICS, start=1):
        slug = to_slug(item["idea"])
        pkg_root = root / slug
        if not pkg_root.exists():
            status = "pending"
        elif (pkg_root / "manifest.json").exists():
            status = "done"
        else:
            status = "partial"
        marker = "✓" if status == "done" else ("~" if status == "partial" else " ")
        print(f"  {i:3d}  [{marker}] {status:<7}  {item['idea']}")
    print(f"{'─'*70}\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Batch generation pipeline for engineering incidents/problems."
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show which topics would be generated without calling the LLM."
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Delete existing output and regenerate everything from scratch."
    )
    parser.add_argument(
        "--topic", type=int, metavar="N",
        help="Generate only topic number N (1-indexed)."
    )
    parser.add_argument(
        "--list", action="store_true", dest="list_topics",
        help="List all topics with their current status and exit."
    )
    parser.add_argument(
        "--mode", choices=["incident", "problem"], default=OUTPUT_MODE,
        help=f"Output mode (default: {OUTPUT_MODE})."
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    # Override globals from args
    global OUTPUT_MODE
    OUTPUT_MODE = args.mode

    if args.list_topics:
        list_topics(OUTPUT_MODE)
        return

    topics = TOPICS
    if args.topic is not None:
        if 1 <= args.topic <= len(TOPICS):
            topics = [TOPICS[args.topic - 1]]
        else:
            print(f"❌ Topic #{args.topic} out of range (1-{len(TOPICS)}).")
            sys.exit(1)

    if args.force:
        print("🗑️  --force: clearing existing output for selected topics...")
        root = INCIDENTS_ROOT if OUTPUT_MODE == "incident" else QUESTIONS_ROOT
        for item in topics:
            slug = to_slug(item["idea"])
            pkg = root / slug
            if pkg.exists():
                import shutil
                shutil.rmtree(pkg)
                print(f"   removed {pkg}")

    total = len(topics)
    print_resume_status(topics, OUTPUT_MODE)

    # Stats tracking
    stats = {"done": 0, "failed": 0, "skipped": 0}
    t_start = time.time()

    for idx, item in enumerate(topics, start=1):
        IDEA     = item["idea"]
        slug     = to_slug(IDEA)
        full_idea = f"{IDEA}\n\nContext:\n{item['info']}"

        print_progress(idx, total, slug, OUTPUT_MODE)
        print(f"🚀 [{idx}/{total}] (mode={OUTPUT_MODE}): '{IDEA}'")

        pkg_root = INCIDENTS_ROOT / slug if OUTPUT_MODE == "incident" else QUESTIONS_ROOT / slug
        pkg_root.mkdir(parents=True, exist_ok=True)

        if args.dry_run:
            exists = (pkg_root / "manifest.json").exists()
            print(f"   {'[exists, would skip]' if exists else '[would generate]'} {slug}")
            stats["skipped" if exists else "done"] += 1
            continue

        try:
            # ── Planning ──────────────────────────────────────────────────────
            print("   ── PLANNING ──")
            plans = run_planning_pipeline(pkg_root, full_idea)

            # ── Generation ────────────────────────────────────────────────────
            print("   ── GENERATION ──")
            if OUTPUT_MODE == "incident":
                generate_incident(pkg_root, full_idea, plans)
            elif OUTPUT_MODE == "problem":
                generate_problem(pkg_root, idx, full_idea, plans)
            else:
                raise ValueError(f"Unknown OUTPUT_MODE: {OUTPUT_MODE!r}")

            print(f"   ✅ Done: '{slug}'")
            stats["done"] += 1

        except KeyboardInterrupt:
            print("\n\n⚠️  Interrupted by user. Progress saved — re-run to resume.\n")
            sys.exit(0)
        except Exception:
            print(f"\n   ❌ FAILED on '{slug}':")
            traceback.print_exc()
            print(f"   ℹ️  Partial output saved to: {pkg_root}")
            print(f"   ℹ️  Re-run the script to resume from where it stopped.\n")
            stats["failed"] += 1
            continue

    # ── Summary ────────────────────────────────────────────────────────────────
    elapsed = time.time() - t_start
    minutes, seconds = divmod(int(elapsed), 60)
    print(f"\n{'═'*60}")
    print(f"  BATCH COMPLETE")
    print(f"  Mode: {OUTPUT_MODE}  |  Languages: {', '.join(LANGS)}")
    print(f"  Topics: {total}  |  Done: {stats['done']}  |  Failed: {stats['failed']}")
    if args.dry_run:
        print(f"  (dry-run — no LLM calls made)")
    print(f"  Time: {minutes}m {seconds}s")
    print(f"{'═'*60}")
    print_resume_status(topics, OUTPUT_MODE)


if __name__ == "__main__":
    main()