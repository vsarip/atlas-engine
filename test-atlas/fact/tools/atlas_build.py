"""Fixture build plugin: exercises the engine's build_data hooks."""


def index_record(rec, entry, content_item):
    # expose aliases to search under compact key "a"
    if entry.get("aliases"):
        rec["a"] = entry["aliases"]
    return rec
