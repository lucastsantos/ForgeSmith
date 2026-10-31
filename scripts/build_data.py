"""Build public/data/smith.json from a Forge checkout.

Usage: python3 scripts/build_data.py <forge-checkout> [output.json]

Needs forge-gui/res/{cardsfolder,editions,adventure/common/config.json}.
Rebuilds the Spell Smith card pool the same way Forge does (RewardData.getAllCards + SpellSmithScene.loadEditions).
"""
import glob
import json
import os
import re
import subprocess
import sys
from collections import defaultdict
from datetime import date, datetime, timezone

SECTIONS = {'cards', 'special slot', 'precon product', 'borderless', 'etched', 'showcase', 'full art',
            'extended art', 'alternate art', 'retro frame', 'buy a box', 'promo', 'prerelease promo', 'bundle',
            'box topper', 'jumpstart', 'rebalanced', 'eternal', 'conjured', 'scheme'}
LINE = re.compile(r'^(?:(\S+)\s+)?([CURMLST])\s+(.+?)(?:\s+@.*)?$')
# Excluded from the Smith edition list (CardEdition.Type.REPRINT_SET_TYPES).
NON_SMITH_TYPES = {'Reprint', 'Promo', 'Collector_Edition'}
COLOR_BITS = {'W': 1, 'U': 2, 'B': 4, 'R': 8, 'G': 16}
COLOR_NAMES = {'white': 'W', 'blue': 'U', 'black': 'B', 'red': 'R', 'green': 'G'}


def parse_editions(res):
    editions = {}
    for path in glob.glob(os.path.join(res, 'editions/*.txt')):
        meta, section, entries, conjured = {}, None, {}, set()
        for line in open(path, encoding='utf-8', errors='ignore'):
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if line.startswith('[') and line.endswith(']'):
                section = line[1:-1].lower()
                continue
            if section == 'metadata':
                if '=' in line:
                    key, value = line.split('=', 1)
                    meta[key.strip()] = value.strip()
                continue
            if section not in SECTIONS:
                continue
            match = LINE.match(line)
            if not match:
                continue
            name = match.group(3).split(' $')[0].strip()
            if section == 'conjured':
                conjured.add(name)
            # SpellSmithScene uses the first entry of the set for the rarity.
            entries.setdefault(name, match.group(2))
        code = meta.get('Code', '').upper()
        if code:
            editions[code] = dict(name=meta.get('Name', code), type=meta.get('Type', ''),
                                  date=meta.get('Date', '0000-00-00'), scryfall=meta.get('ScryfallCode', code).lower(),
                                  entries=entries, conjured=conjured)
    return editions


def cmc_of(cost):
    """Forge mana symbols: '3', 'X', 'R', hybrid 'GW', phyrexian 'BP', mono-hybrid '2R' or '2/R'."""
    if not cost or cost.lower() == 'no cost':
        return 0
    total = 0
    for symbol in cost.split():
        if symbol.isdigit():
            total += int(symbol)
        elif symbol in ('X', 'Y', 'Z'):
            continue
        else:
            leading = re.match(r'^(\d+)/?', symbol)
            total += int(leading.group(1)) if leading else 1
    return total


def color_mask(cost, override):
    if override:
        letters = [COLOR_NAMES.get(c.strip().lower()) for c in override.split(',')]
    elif cost and cost.lower() != 'no cost':
        letters = [ch for symbol in cost.split() if symbol not in ('X', 'Y', 'Z') for ch in symbol]
    else:
        letters = []
    mask = 0
    for letter in letters:
        mask |= COLOR_BITS.get(letter, 0)
    return mask


def parse_cards(res):
    cards = {}
    for path in glob.glob(os.path.join(res, 'cardsfolder/*/*.txt')):
        text = open(path, encoding='utf-8', errors='ignore').read()
        # Mirrors the RemNonCommanderDecks filter applied outside Commander mode.
        if 'RemoveDeck:NonCommander' in text:
            continue
        faces, current, mode = [], {}, None
        for line in text.splitlines():
            line = line.strip()
            if line == 'ALTERNATE':
                faces.append(current)
                current = {}
                continue
            if ':' in line:
                key, value = line.split(':', 1)
                if key in ('Name', 'ManaCost', 'Colors') and key not in current:
                    current[key] = value.strip()
                if key == 'AlternateMode':
                    mode = value.strip()
        faces.append(current)
        main = faces[0]
        if 'Name' not in main:
            continue
        # Split cards combine both halves (CardSplitType COMBINE); other layouts use the front face.
        if mode == 'Split' and len(faces) > 1:
            other = faces[1]
            name = main['Name'] + ' // ' + other.get('Name', '')
            cmc = cmc_of(main.get('ManaCost')) + cmc_of(other.get('ManaCost'))
            mask = color_mask(main.get('ManaCost'), main.get('Colors')) | color_mask(other.get('ManaCost'), other.get('Colors'))
        else:
            name = main['Name']
            cmc = cmc_of(main.get('ManaCost'))
            mask = color_mask(main.get('ManaCost'), main.get('Colors'))
        cards[name] = (mask, cmc)
    return cards


def build(forge_root):
    res = os.path.join(forge_root, 'forge-gui/res')
    editions = parse_editions(res)
    cards = parse_cards(res)
    config = json.load(open(os.path.join(res, 'adventure/common/config.json')))
    restricted_editions = {c.upper() for c in config.get('restrictedEditions', [])}
    restricted_cards = set(config.get('restrictedCards', []))

    prints = defaultdict(list)
    for code, edition in editions.items():
        for name, rarity in edition['entries'].items():
            prints[name].append((edition['date'], code, rarity))

    pool = {}
    for name, (mask, cmc) in cards.items():
        printings = prints.get(name)
        if not printings or name in restricted_cards:
            continue
        if not any(code not in restricted_editions and name not in editions[code]['conjured'] for _, code, _ in printings):
            continue
        # Unique print = newest non-Special printing (LATEST_ART_ALL_EDITIONS).
        regular = [p for p in printings if p[2] != 'S'] or printings
        _, unique_edition, rarity = max(regular)
        pool[name] = dict(mask=mask, cmc=cmc, rarity=rarity, unique_edition=unique_edition)

    names = sorted(pool)
    index = {name: i for i, name in enumerate(names)}
    unique_editions = {card['unique_edition'] for card in pool.values()}
    today = date.today().isoformat()

    out_editions = []
    for code, edition in sorted(editions.items(), key=lambda kv: kv[1]['name']):
        # A set is only listed when some pool card uses it as unique print and it is not released today or later
        # (SpellSmithScene.loadEditions).
        if edition['type'] in NON_SMITH_TYPES or edition['date'] >= today or code not in unique_editions:
            continue
        members = sorted((index[n], r) for n, r in edition['entries'].items() if n in index)
        if not members:
            continue
        out_editions.append(dict(code=code, name=edition['name'], type=edition['type'], date=edition['date'],
                                 icon=edition['scryfall'], cards=[m[0] for m in members],
                                 rarities=''.join(m[1] for m in members)))

    commit = subprocess.run(['git', '-C', forge_root, 'rev-parse', '--short', 'HEAD'],
                            capture_output=True, text=True).stdout.strip()
    generated_at = datetime.now(timezone.utc).isoformat(timespec='seconds')
    return dict(
        meta=dict(forgeCommit=commit, generatedAt=generated_at, cardCount=len(names), editionCount=len(out_editions)),
        cards=[[name, pool[name]['mask'], pool[name]['cmc'], pool[name]['rarity']] for name in names],
        editions=out_editions,
    )


def write(data, output):
    """Atomic write, so the web server never serves a half-written file."""
    os.makedirs(os.path.dirname(os.path.abspath(output)), exist_ok=True)
    tmp = output + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    os.chmod(tmp, 0o644)
    os.replace(tmp, output)


if __name__ == '__main__':
    forge_root = sys.argv[1]
    output = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), '..', 'public/data/smith.json')
    data = build(forge_root)
    write(data, output)
    print(f"{data['meta']['cardCount']} cards, {data['meta']['editionCount']} editions -> {output}")
