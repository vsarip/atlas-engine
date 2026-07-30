#!/usr/bin/env python3
"""Compile atlas data (engine tool — configured by atlas.config.json).

<catalog json>  +  content/<id>.json
    -> app/public/data/index.js           (full catalog, loaded at startup)
    -> app/public/data/concepts/c<id>.js  (one shard per enriched entry)
    -> app/public/data/<asset dirs>       (config data_assets, copied verbatim)

atlas.config.json keys used:
    name              site title (ATLAS_META.title)
    catalog           path to the source-of-truth catalog json
    latex_conversion  bool (default true) — mechanical Unicode->LaTeX of
                      statements + prose detection; off for no-math atlases
    data_assets       [dirs] copied into data/ (e.g. flag SVGs)
    build_plugin      optional atlas-local py file with hooks:
                        prepare(dataset, content, cfg, root)   pre-compile mutate
                        index_record(rec, entry, content_item) augment compact rec
                        shard_payload(payload, entry)          augment shard
                        post_build(out_dir, cfg, root)         extra outputs

Stdlib only. Safe to run repeatedly; output dirs are fully regenerated.
"""
import json
import re
import shutil
import unicodedata
from pathlib import Path

import atlas_config

# ---------------------------------------------------------------- slugs

GREEK_NAMES = {
    "α": "alpha", "β": "beta", "γ": "gamma", "δ": "delta", "ε": "epsilon",
    "θ": "theta", "λ": "lambda", "μ": "mu", "π": "pi", "ρ": "rho",
    "σ": "sigma", "τ": "tau", "φ": "phi", "χ": "chi", "ψ": "psi", "ω": "omega",
    "Δ": "delta", "Σ": "sigma", "Ω": "omega", "Φ": "phi", "Ψ": "psi",
}


def slugify(name: str) -> str:
    s = name.lower()
    for g, latin in GREEK_NAMES.items():
        s = s.replace(g.lower(), latin)
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "entry"


# ------------------------------------------- mechanical Unicode -> LaTeX

SUPERSCRIPTS = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6",
    "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "-", "ⁿ": "n", "ⁱ": "i",
    "ᵗ": "t",
    "⁽": "(", "⁾": ")",
}
SUBSCRIPTS = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6",
    "₇": "7", "₈": "8", "₉": "9", "₊": "+", "₋": "-", "ₐ": "a", "ₑ": "e",
    "ₓ": "x", "ₙ": "n", "ₘ": "m", "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₚ": "p",
    "ₛ": "s", "ₜ": "t", "ᵣ": "r", "ᵥ": "v", "ₒ": "o", "ₗ": "l", "ₕ": "h",
    "₍": "(", "₎": ")",
}

# base char + combining mark  ->  wrapping LaTeX accent
COMBINING = {
    "̂": r"\hat",   # ◌̂
    "̃": r"\tilde", # ◌̃
    "̄": r"\bar",   # ◌̄ macron
    "̅": r"\bar",   # ◌̅ overline
    "̇": r"\dot",   # ◌̇
    "⃗": r"\vec",   # ◌⃗
}
SYMBOLS = {
    "·": r" \cdot ", "×": r" \times ", "÷": r" \div ", "±": r" \pm ",
    "∓": r" \mp ", "≈": r" \approx ", "≠": r" \neq ", "≡": r" \equiv ",
    "≤": r" \leq ", "≥": r" \geq ", "≪": r" \ll ", "≫": r" \gg ",
    "∝": r" \propto ", "∞": r" \infty ", "→": r" \to ", "←": r" \leftarrow ",
    "↔": r" \leftrightarrow ", "⇌": r" \rightleftharpoons ",
    "⇒": r" \Rightarrow ", "⇔": r" \Leftrightarrow ",
    "∂": r"\partial ", "∇": r"\nabla ", "∫": r"\int ", "∮": r"\oint ",
    "∑": r"\sum ", "∏": r"\prod ", "√": r"\sqrt", "∈": r" \in ",
    "∉": r" \notin ", "⊂": r" \subset ", "⊆": r" \subseteq ", "∪": r" \cup ",
    "∩": r" \cap ", "∅": r"\varnothing ", "∀": r"\forall ", "∃": r"\exists ",
    "∧": r" \wedge ", "∨": r" \vee ", "¬": r"\neg ", "⊕": r" \oplus ",
    "⊗": r" \otimes ", "∘": r" \circ ", "°": r"^{\circ}", "′": "'",
    "″": "''", "…": r"\ldots ", "ℏ": r"\hbar ", "ħ": r"\hbar ",
    "ℓ": r"\ell ", "ℝ": r"\mathbb{R} ", "ℕ": r"\mathbb{N} ",
    "ℤ": r"\mathbb{Z} ", "ℚ": r"\mathbb{Q} ", "ℂ": r"\mathbb{C} ",
    "Å": r"\text{\AA} ", "μ": r"\mu ", "π": r"\pi ", "α": r"\alpha ",
    "β": r"\beta ", "γ": r"\gamma ", "δ": r"\delta ", "ε": r"\varepsilon ",
    "ζ": r"\zeta ", "η": r"\eta ", "θ": r"\theta ", "ι": r"\iota ",
    "κ": r"\kappa ", "λ": r"\lambda ", "ν": r"\nu ", "ξ": r"\xi ",
    "ρ": r"\rho ", "σ": r"\sigma ", "τ": r"\tau ", "υ": r"\upsilon ",
    "φ": r"\varphi ", "ϕ": r"\phi ", "χ": r"\chi ", "ψ": r"\psi ",
    "ω": r"\omega ", "Γ": r"\Gamma ", "Δ": r"\Delta ", "Θ": r"\Theta ",
    "Λ": r"\Lambda ", "Ξ": r"\Xi ", "Π": r"\Pi ", "Σ": r"\Sigma ",
    "Υ": r"\Upsilon ", "Φ": r"\Phi ", "Ψ": r"\Psi ", "Ω": r"\Omega ",
    "ψ̂": r"\hat{\psi} ", "θ̂": r"\hat{\theta} ",
    "½": r"\tfrac{1}{2}", "⅓": r"\tfrac{1}{3}", "¼": r"\tfrac{1}{4}",
    "⅔": r"\tfrac{2}{3}", "¾": r"\tfrac{3}{4}", "−": "-", "–": "-",
    "‖": r"\|", "⟨": r"\langle ", "⟩": r"\rangle ", "∥": r" \parallel ",
    "⊥": r" \perp ", "∠": r"\angle ", "△": r"\triangle ", "□": r"\square ",
    "≅": r" \cong ", "∼": r" \sim ", "≃": r" \simeq ", "∗": r" \ast ",
    "∙": r" \cdot ", "⋅": r" \cdot ", "&": r" \& ", "%": r" \% ",
}


def run_convert(text: str, table: dict, wrap: str) -> str:
    """Convert runs of chars found in `table` into wrap{...} groups."""
    out, i, n = [], 0, len(text)
    while i < n:
        ch = text[i]
        if ch in table:
            j = i
            run = []
            while j < n and text[j] in table:
                run.append(table[text[j]])
                j += 1
            out.append(wrap % "".join(run))
            i = j
        else:
            out.append(ch)
            i += 1
    return "".join(out)


def _match_paren(s: str, open_idx: int):
    """Given index of a '(', return (inner_text, index_after_close)."""
    depth, j, n = 1, open_idx + 1, len(s)
    while j < n and depth:
        if s[j] == "(":
            depth += 1
        elif s[j] == ")":
            depth -= 1
        j += 1
    inner = s[open_idx + 1:j - 1] if depth == 0 else s[open_idx + 1:j]
    return inner, j


def combining_accents(s: str) -> str:
    """base char + combining mark -> \\hat{base}, \\bar{base}, etc."""
    out, i, n = [], 0, len(s)
    while i < n:
        if i + 1 < n and s[i + 1] in COMBINING:
            out.append(COMBINING[s[i + 1]] + "{" + s[i] + "}")
            i += 2
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


def sqrt_groups(s: str) -> str:
    r"""Give every bare \sqrt an argument: \sqrt(x), \sqrtn, \sqrtVar(X) -> braces."""
    out, i, n = [], 0, len(s)
    while i < n:
        if s.startswith(r"\sqrt", i) and not s.startswith(r"\sqrt{", i):
            j = i + 5
            if j < n and s[j] == "(":
                inner, j = _match_paren(s, j)
                out.append(r"\sqrt{" + inner + "}")
            elif j < n and (s[j].isalnum()):
                k = j
                while k < n and s[k].isalnum():
                    k += 1
                if k < n and s[k] == "(":  # e.g. Var(X)
                    inner, k = _match_paren(s, k)
                    out.append(r"\sqrt{" + s[j:k] + "}")
                else:
                    out.append(r"\sqrt{" + s[j:k] + "}")
                j = k
            else:
                out.append(r"\sqrt{}")
            i = j
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


# A LaTeX command directly after _ or ^ must be braced: x_\max -> x_{\max}.
SUBSUP_CMD = re.compile(r"([_^])\\([a-zA-Z]+)")


def brace_subsup_commands(s: str) -> str:
    return SUBSUP_CMD.sub(lambda m: f"{m.group(1)}{{\\{m.group(2)}}}", s)


def caret_groups(s: str) -> str:
    """Turn x^(...) and x_(...) into x^{...} / x_{...} with paren matching."""
    out, i, n = [], 0, len(s)
    while i < n:
        if s[i] in "^_" and i + 1 < n and s[i + 1] == "(":
            inner, j = _match_paren(s, i + 1)
            out.append(s[i] + "{" + inner + "}")
            i = j
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


MATH_HINT = re.compile(r"[=<>+^_\\{}]|\\frac|\\int|\\sum|\d")
WORD = re.compile(r"[A-Za-z]{2,}")

# LaTeX-recognizable function names to keep upright
FUNCS = ["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos",
         "arctan", "sinh", "cosh", "tanh", "ln", "log", "exp", "lim",
         "max", "min", "det", "dim", "ker", "deg", "gcd", "arg", "mod"]


RELATION_CHARS = set("=<>") | set("≈≤≥∝≠≡≅∼≃⇌→⇒⇔↔")


def is_prose(statement: str) -> bool:
    """True when the statement reads as a sentence, not a formula.

    A relation symbol (=, ≤, →, …) makes it a formula. Otherwise, a string
    dominated by ordinary words (3+ tokens of 4+ letters) is descriptive prose
    — this catches short captions with a stray sub/superscript that would
    otherwise render as ugly half-math.
    """
    if any(c in statement for c in RELATION_CHARS):
        return False
    longwords = re.findall(r"[A-Za-z]{4,}", statement)
    return len(longwords) >= 3


def unicode_to_latex(statement: str) -> str:
    s = statement
    s = combining_accents(s)  # x̄ -> \bar{x}, r̂ -> \hat{r}
    s = caret_groups(s)  # x^(...) / x_(...) -> braces, before symbol subst
    s = run_convert(s, SUPERSCRIPTS, "^{%s}")
    s = run_convert(s, SUBSCRIPTS, "_{%s}")
    for ch, tex in SYMBOLS.items():
        s = s.replace(ch, tex)
    s = sqrt_groups(s)
    # keep function names upright
    for f in sorted(FUNCS, key=len, reverse=True):
        s = re.sub(rf"(?<![A-Za-z\\]){f}(?![A-Za-z])", "\\\\" + f + " ", s)
    # words of >=4 letters that aren't LaTeX commands -> \text{}
    def textify(m):
        w = m.group(0)
        return w if s[max(0, m.start() - 1)] == "\\" else r"\text{" + w + "}"
    s = re.sub(r"(?<!\\)\b[A-Za-z]{4,}\b", textify, s)
    s = brace_subsup_commands(s)  # x_\max -> x_{\max}
    s = re.sub(r"\s+", " ", s).strip()
    return s


# ---------------------------------------------------------------- main

def js_literal(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def load_content(content_dir: Path) -> dict:
    content = {}
    if content_dir.is_dir():
        for f in sorted(content_dir.glob("*.json")):
            data = json.loads(f.read_text(encoding="utf-8"))
            cid = data.get("id")
            if not isinstance(cid, int):
                raise SystemExit(f"{f.name}: missing/invalid integer 'id'")
            if cid in content:
                raise SystemExit(f"duplicate content for id {cid} ({f.name})")
            content[cid] = data
    return content


def main():
    cfg, root = atlas_config.load()
    src = root / cfg["catalog"]
    content_dir = root / "content"
    out_dir = root / "app" / "public" / "data"
    latex_on = cfg.get("latex_conversion", True)
    plugin = (
        atlas_config.load_plugin(root, cfg["build_plugin"])
        if cfg.get("build_plugin")
        else None
    )

    dataset = json.loads(src.read_text(encoding="utf-8"))
    entries = dataset["entries"]
    content = load_content(content_dir)

    if plugin and hasattr(plugin, "prepare"):
        plugin.prepare(dataset, content, cfg, root)

    known_ids = {e["id"] for e in entries}
    for cid in content:
        if cid not in known_ids:
            raise SystemExit(f"content/{cid}.json refers to unknown entry id")

    # validate related links + slug uniqueness
    slugs = {}
    for e in entries:
        slug = slugify(e["name"])
        if slug in slugs:
            slug = f"{slug}-{e['id']}"
        slugs[slug] = e["id"]
        e["_slug"] = slug
    for cid, c in content.items():
        for rid in c.get("related", []):
            if rid not in known_ids:
                raise SystemExit(f"content/{cid}: related id {rid} does not exist")

    if out_dir.exists():
        shutil.rmtree(out_dir)
    (out_dir / "concepts").mkdir(parents=True)

    catalog = []
    for e in entries:
        c = content.get(e["id"])
        if latex_on:
            prose = is_prose(e["statement"])
            latex = None
            if c and c.get("latex"):
                latex = c["latex"]
                prose = False
            elif not prose:
                latex = unicode_to_latex(e["statement"])
        else:
            latex = None
        rec = {
            "i": e["id"],
            "s": e["_slug"],
            "n": e["name"],
            "f": e["field"],
            "d": e["discipline"],
            "t": e["type"],
            "u": e["statement"],
            **({"x": latex} if latex else {}),
            **({"r": 1} if c else {}),
        }
        if plugin and hasattr(plugin, "index_record"):
            rec = plugin.index_record(rec, e, c) or rec
        catalog.append(rec)

    meta = {
        "title": cfg["name"],
        "count": len(entries),
        "fields": dataset["fields"],
        "types": dataset["types"],
    }
    index_js = (
        "// generated by tools/engine/build_data.py -- do not edit\n"
        f"window.ATLAS_META={js_literal(meta)};\n"
        f"window.ATLAS_INDEX={js_literal(catalog)};\n"
    )
    (out_dir / "index.js").write_text(index_js, encoding="utf-8")

    entries_by_id = {e["id"]: e for e in entries}
    for cid, c in sorted(content.items()):
        payload = dict(c)
        if plugin and hasattr(plugin, "shard_payload"):
            payload = plugin.shard_payload(payload, entries_by_id[cid]) or payload
        shard = (
            "// generated by tools/engine/build_data.py -- do not edit\n"
            f"window.__atlasShard({js_literal(payload)});\n"
        )
        (out_dir / "concepts" / f"c{cid}.js").write_text(shard, encoding="utf-8")

    for asset_dir in cfg.get("data_assets", []):
        src_dir = root / asset_dir
        if not src_dir.is_dir():
            raise SystemExit(f"data_assets dir not found: {asset_dir}")
        shutil.copytree(src_dir, out_dir / src_dir.name)

    if plugin and hasattr(plugin, "post_build"):
        plugin.post_build(out_dir, cfg, root)

    print(f"catalog: {len(catalog)} entries -> {out_dir / 'index.js'}")
    print(f"shards:  {len(content)} enriched -> {out_dir / 'concepts'}")


if __name__ == "__main__":
    main()
