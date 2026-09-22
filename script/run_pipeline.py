#!/usr/bin/env python
import subprocess
import sys
from pathlib import Path

# Compatibility entry point. The old HTML scraper cannot parse the current wiki.
subprocess.run(["node", "refresh_data.mjs", *sys.argv[1:]], check=True, cwd=Path(__file__).parent)
