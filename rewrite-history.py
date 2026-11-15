
#!/usr/bin/env python3

import random
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Configuration
DAYS = 368
SEED = None  # Set an integer for reproducibility

random.seed(SEED)

def git(*args):
    return subprocess.check_output(
        ["git", *args], text=True
    ).strip()

# Collect commits in order.
commits = git(
    "rev-list", "--reverse", "--all"
).splitlines()

if not commits:
    raise SystemExit("No commits found.")

# Create daily weights with random variation.
weights = [
    random.expovariate(1.0)
    for _ in range(DAYS)
]

# Ensure the distribution covers the entire period.
weights[0] = max(weights[0], 0.01)
weights[-1] = max(weights[-1], 0.01)

# Assign commits proportionally to daily weights.
total = sum(weights)
cumulative = []
running = 0

for weight in weights:
    running += weight
    cumulative.append(running / total)

end = datetime.now(timezone.utc).replace(
    hour=23, minute=59, second=59, microsecond=0
)

start = end - timedelta(days=DAYS - 1)

timestamps = []

for i in range(len(commits)):
    position = (i + 0.5) / len(commits)

    day_index = next(
        (j for j, value in enumerate(cumulative)
         if value >= position),
        DAYS - 1
    )

    day = start + timedelta(days=day_index)

    timestamp = day + timedelta(
        seconds=random.randint(0, 86399)
    )

    timestamps.append(int(timestamp.timestamp()))

# Ensure timestamps are monotonically increasing.
timestamps.sort()

# Map commits to timestamps.
dates = dict(zip(commits, timestamps))

# Generate environment filter.
script = Path("/tmp/git-date-filter.sh")

with script.open("w") as f:
    f.write('case "$GIT_COMMIT" in\n')

    for commit, timestamp in dates.items():
        f.write(
            f"{commit}) "
            f'GIT_AUTHOR_DATE="@{timestamp} +0000"; '
            f'GIT_COMMITTER_DATE="@{timestamp} +0000"; '
            "export GIT_AUTHOR_DATE GIT_COMMITTER_DATE;;\n"
        )

    f.write("esac\n")

# Rewrite history.
subprocess.run([
    "git",
    "filter-branch",
    "--force",
    "--tag-name-filter", "cat",
    "--env-filter", f". {script}",
    "--",
    "--all"
], check=True)

print(f"Rewritten {len(commits)} commits.")
print(f"Date range: {start.date()} to {end.date()}")

