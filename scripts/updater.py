"""Keeps smith.json in sync with the latest Forge: runs once on start, then daily.

Environment:
  FORGE_REPO        git URL of Forge (default: Card-Forge/forge on GitHub)
  FORGE_BRANCH      branch to track (default: master)
  FORGE_DIR         sparse checkout location (default: /forge)
  DATA_FILE         output file (default: /data/smith.json)
  UPDATE_TIME_UTC   daily run time, HH:MM in UTC (default: 06:00)
  RETRY_MINUTES     wait after a failed run (default: 60)
"""
import os
import subprocess
import sys
import time
from datetime import datetime, timedelta, timezone

from build_data import build, write

FORGE_REPO = os.environ.get('FORGE_REPO', 'https://github.com/Card-Forge/forge.git')
FORGE_BRANCH = os.environ.get('FORGE_BRANCH', 'master')
FORGE_DIR = os.environ.get('FORGE_DIR', '/forge')
DATA_FILE = os.environ.get('DATA_FILE', '/data/smith.json')
UPDATE_TIME_UTC = os.environ.get('UPDATE_TIME_UTC', '06:00')
RETRY_MINUTES = int(os.environ.get('RETRY_MINUTES', '60'))
SPARSE_PATHS = ['forge-gui/res/cardsfolder', 'forge-gui/res/editions', 'forge-gui/res/adventure/common']


def log(message):
    print(f"[{datetime.now(timezone.utc).isoformat(timespec='seconds')}] {message}", flush=True)


def git(*args, cwd=FORGE_DIR):
    subprocess.run(['git', *args], cwd=cwd, check=True, stdout=subprocess.DEVNULL)


def sync_forge():
    """Shallow, blobless, sparse checkout: only the card scripts, editions and adventure config are downloaded."""
    if not os.path.isdir(os.path.join(FORGE_DIR, '.git')):
        log(f'cloning {FORGE_REPO} ({FORGE_BRANCH})')
        os.makedirs(FORGE_DIR, exist_ok=True)
        git('clone', '--quiet', '--depth', '1', '--filter=blob:none', '--sparse', '--branch', FORGE_BRANCH,
            FORGE_REPO, '.')
        git('sparse-checkout', 'set', *SPARSE_PATHS)
    else:
        git('fetch', '--quiet', '--depth', '1', '--filter=blob:none', 'origin', FORGE_BRANCH)
        git('reset', '--quiet', '--hard', 'FETCH_HEAD')
    return subprocess.run(['git', 'rev-parse', '--short', 'HEAD'], cwd=FORGE_DIR, check=True,
                          capture_output=True, text=True).stdout.strip()


def update():
    started = time.monotonic()
    commit = sync_forge()
    # Rebuilt even without new commits: sets become available on their release date.
    data = build(FORGE_DIR)
    write(data, DATA_FILE)
    meta = data['meta']
    log(f"updated to forge {commit}: {meta['cardCount']} cards, {meta['editionCount']} editions "
        f"in {time.monotonic() - started:.1f}s")


def seconds_until_next_run():
    hour, minute = (int(part) for part in UPDATE_TIME_UTC.split(':'))
    now = datetime.now(timezone.utc)
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)
    return (target - now).total_seconds(), target


def main():
    if '--once' in sys.argv:
        update()
        return
    while True:
        try:
            update()
            wait, target = seconds_until_next_run()
            log(f'next update at {target.isoformat(timespec="minutes")}')
        except Exception as error:  # Keep the service alive; the next attempt may succeed.
            wait = RETRY_MINUTES * 60
            log(f'update failed: {error}; retrying in {RETRY_MINUTES} min')
        time.sleep(wait)


if __name__ == '__main__':
    main()
