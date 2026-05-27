#!/usr/bin/env python3
"""
Placeholder content-generation CLI for seeo.ai.

NOTE:
- This intentionally does NOT attempt to run karpathy/autoresearch.
- karpathy/autoresearch is a GPU-based autonomous LLM *pretraining research* loop, not a writing assistant.

This script defines the minimal interface we want for post generation:
topic + audience + constraints -> structured draft output (JSON).

Later, you can swap the implementation to call:
- a hosted LLM API (recommended), or
- a local agent/backend, or
- a build-time content generator.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class GenerateRequest:
    topic: str
    audience: str
    constraints: str
    author: Optional[str]


@dataclass(frozen=True)
class GenerateResponse:
    title: str
    hook: str
    outline: List[str]
    draft_markdown: str
    sources: List[Dict[str, str]]
    claims: List[Dict[str, str]]
    meta: Dict[str, Any]


def generate_stub(req: GenerateRequest) -> GenerateResponse:
    title = f"{req.topic}: a practical take for {req.audience}"
    hook = (
        f"If you care about {req.topic}, here’s the shortest path to a useful mental model "
        f"and a set of next actions for {req.audience}."
    )
    outline = [
        "The problem in one paragraph",
        "A simple model (with one example)",
        "Common mistakes and how to avoid them",
        "A checklist you can apply this week",
        "Open questions / what to read next",
    ]
    draft_markdown = "\n".join(
        [
            f"# {title}",
            "",
            f"**Hook:** {hook}",
            "",
            "## Outline",
            *[f"- {item}" for item in outline],
            "",
            "## Draft",
            f"Write the draft here. Constraints: {req.constraints}",
            "",
            "## Sources",
            "- (placeholder) Add sources + links here.",
            "",
            "## Claims to fact-check",
            "- (placeholder) Add any key claims here.",
        ]
    )

    return GenerateResponse(
        title=title,
        hook=hook,
        outline=outline,
        draft_markdown=draft_markdown,
        sources=[],
        claims=[],
        meta={
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generator": "scripts/autoresearch_generate.py (stub)",
            "author": req.author,
        },
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a structured post draft (stub).")
    parser.add_argument("--topic", required=True, help="Post topic, e.g. 'AI agent evaluation'")
    parser.add_argument("--audience", required=True, help="Target audience, e.g. 'startup founders'")
    parser.add_argument(
        "--constraints",
        default="",
        help="Writing constraints, e.g. '800-1200 words, practical, no hype, include 3 examples'",
    )
    parser.add_argument(
        "--author",
        default=None,
        help="Optional author name, e.g. 'Craig Marris' (used only for metadata).",
    )
    parser.add_argument(
        "--format",
        choices=["json"],
        default="json",
        help="Output format (currently only json).",
    )
    args = parser.parse_args()

    req = GenerateRequest(
        topic=args.topic.strip(),
        audience=args.audience.strip(),
        constraints=args.constraints.strip(),
        author=(args.author.strip() if args.author is not None else None),
    )
    res = generate_stub(req)
    print(json.dumps(asdict(res), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

