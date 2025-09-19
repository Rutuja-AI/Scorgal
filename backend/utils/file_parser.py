import re

def find_contract_start(text: str) -> str:
    """
    Detect where the actual contract starts.
    Skips TOC and finds first real clause or AGREEMENT.
    """
    lines = text.splitlines()
    contract_lines = []
    started = False

    # TOC lines like "1. DEFINITIONS........1"
    toc_pattern = re.compile(r"^\s*\d+(\.\d+)*\s+[A-Z][A-Za-z\s]+\.{3,}\d+\s*$")
    # Real clause headings like "1. DEFINITIONS" or "2.1 ENGAGEMENT"
    clause_pattern = re.compile(r"^\s*\d+(\.\d+)*\s+[A-Z]")

    for i, line in enumerate(lines):
        clean = line.strip()

        if not clean or toc_pattern.match(clean):
            continue

        if not started and re.search(r"\b(AGREEMENT|THIS AGREEMENT|PARTIES|WITNESSETH)\b", clean, re.I):
            started = True

        if not started and clause_pattern.match(clean):
            started = True

        if started:
            contract_lines.append(line)

    return "\n".join(contract_lines)
