# Source and verification ledger

Research date: 9 September 2026. Source code was downloaded for inspection, not installed as a user application. AstroPlanner was inspected through its existing signed-in interface; no account settings, sessions, diary, or plan were saved or changed.

| Source | Pinned version / location | Purpose |
|---|---|---|
| [SkyFrame](https://github.com/sparrowjack63/SkyFrame) | `a7744a4e77dc691b8bf7141971a8b24c8d845e28` | Reuse assessment; existing tests. AGPL-3.0-or-later per repository. No SkyFrame code or editorial descriptions are embedded in the interaction study. |
| [Stellarium Web Engine](https://github.com/Stellarium/stellarium-web-engine) | `e7201246bdf7289c50a3ec59e98f69f0f9383b05` | Inspected custom layers, shapes, observer frame conversion, JS wrapper and examples. AGPL-3.0 notice. Not compiled or integrated in this pass. |
| [OpenNGC](https://github.com/mattiaverga/OpenNGC) | `da90466031b0372c896588b85be6016c617e205b` | Catalogue subset and outline traces embedded in the study. Data CC BY-SA 4.0. Credit Mattia Verga and upstream sources recorded by OpenNGC. |
| [d3-celestial](https://github.com/ofrohn/d3-celestial) | `7e720a3de062059d4c5400a379146a601d9010e0` | Stars from `stars.6.json` filtered to magnitude ≤5.7, constellation line coordinates. BSD-3-Clause notice retained below and in the study source. |
| [Astronomy Engine](https://github.com/cosinekitty/astronomy) | npm `2.1.19` browser distribution | Precomputed J2000-to-horizontal rotation matrices and topocentric Moon directions for a fixed example night; cross-checks. MIT library. The numerical results are embedded, not the library. |
| [Aladin Lite API](https://cds-astro.github.io/aladin-lite/index.html) | Documentation inspected September 2026 | Alternative photographic renderer; coordinate-frame options. Project GPL-3.0 licence should be reviewed in final dependency selection. |
| [HiPS2FITS documentation](https://alasky.cds.unistra.fr/hips-image-services/hips2fits) | Current documentation | Cutout service as a future imagery source. No survey photographs were downloaded or embedded in the study. |
| [NASA FITS WCS](https://fits.gsfc.nasa.gov/fits_wcs.html) | Standards reference | Pixel-to-celestial calibration and distortion conventions. |
| [Astrometry.net API](https://astrometry.net/doc/net/api.html) | Current documentation | Image calibration/plate-solving workflow and WCS outputs. No user photos submitted. |
| [DWARF Mini manual](https://help.dwarflab.com/en/docs/DWARF-mini-Smart-Telescope-User-Manual) | Current public manual, Astro Mosaic section | Confirms 1.8×1.8 overall composition, up to four views and EQ requirement. |
| [All-Star Telescope Mini specification](https://usa.all-startelescope.com/products/dwarflab-dwarf-mini-smart-telescope-dwarf-mini) | Current product table | D 2.45°, H 2.14°, V 1.20° and 1920×1080 preset. Manufacturer product page was also inspected, but its scraped text did not expose this full table. |
| [NASA Caldwell 27](https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-caldwell-catalog/caldwell-27/) | Current target page | Identifies C27 as NGC6888 / Crescent Nebula. |

## Data transformations

`research/build-data.py` selects the relevant catalogue subset, preserves null values, bands, major/minor axes and position angle, and converts RA hours to degrees. A handful of display names are normalized. Star positions are rounded to five decimal places; selected outlines are rounded and some are decimated to keep the study compact. The numerical data and all such adaptations of OpenNGC remain under CC BY-SA 4.0. [Licence](https://creativecommons.org/licenses/by-sa/4.0/)

The original outline files were drawn in Aladin against DSS2 at different histogram levels, as explained in [OpenNGC methodology](https://github.com/mattiaverga/OpenNGC/blob/da90466031b0372c896588b85be6016c617e205b/outlines/metodology.txt). They are not exact physical edges. A file may include connected neighbouring nebulosity. The concept labels them as published contours and does not stretch an image to match a catalogue diameter.

`research/build-rotations.cjs` calculates 97 samples, five minutes apart, from 2026-09-10 04:00 UTC to 12:00 UTC, at latitude 49.28°, longitude −123.12°, elevation 0. This is a coarse Vancouver example, not a recovered home position. The map uses geometric altitude with no atmospheric refraction, and intentionally has no darkness/scheduling gate. The fake balcony opening is an editable design example.

## Source audit reproducibility

Read source at the pinned commits, rather than relying on marketing text. The primary SkyFrame findings are in `js/ui/modal.js`, `js/catalog/scoring.js`, `js/catalog/load.js` and `js/astro/core.js`.

The upstream command run was:

```sh
node --test tests/astro.test.js tests/catalog.test.js tests/load.test.js tests/planner.test.js
```

Result: 44 passed, 0 failed.

The original geometry experiment is in `research/geometry.js`. Its local check is:

```sh
node --test outputs/sky-patch/research/geometry.test.cjs
```

Result at creation: 7 passed, 0 failed. The Astronomy Engine comparison test expects the downloaded npm browser distribution at the path documented in the test. Downloaded repositories/libraries live in a temporary research directory; they are not necessary to use the self-contained in-conversation study. Preserve or re-download pinned inputs to regenerate the data later.

## BSD notice for d3-celestial

Copyright (c) 2015, Olaf Frohn
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
