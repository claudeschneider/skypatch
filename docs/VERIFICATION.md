# Phase-one verification

Implemented and checked on 9 September 2026.

## Automated checks

- **8 unit tests passed:** coordinate round trips near both poles and RA wraparound; true Mini frame dimensions; approximately 19-pixel M57 long-axis sampling; full North America contour/mosaic fit; viewport aspect-ratio projection; null photometry handling; reversible horizon filtering; catalogue-name searches.
- **5 browser workflow tests passed** in a separate headless Google Chrome profile: engine and object registration; location/date changes and keyboard panning; filters and excluded-object search; both mosaic dimensions; full-object viewport fit; persistence; 390px mobile layout; failed survey-image fallback.
- The fifth browser check compares the five reference targets against independent Astronomy Engine calculations at Vancouver, Sydney and an Iceland example in 2026–2028. Altitudes agreed within 0.02° and azimuths within 0.05°; geometric horizon conventions are used.
- Dependency audit reported **zero known vulnerabilities** with the pinned lockfile.

## Visual and interaction checks

Inspected wide sky, fixed-scale discovery thumbnails, M57 framing, North America Nebula 1.8× mosaic, and the mobile map. Verified mouse-wheel zoom changes the engine FOV. Source survey images loaded successfully from CDS during the visual check. Also tested a deliberate cutout failure: the app retained frame geometry and displayed an unavailable-image message.

Screenshots are retained in this folder. They show a coarse Vancouver example at 22:00 device time on 9 September, not the user's balcony calibration. The view uses geometric sky positions with daylight rendering disabled and a day/twilight/night label.

## Known limitations

- Actual Mini camera orientation and final stacking crop are not calibrated. Position angle is a labelled planning assumption, not a rotator command.
- No local obstacle masks or scope-photo processing; these are explicitly deferred phases.
- Full table, Moon-separation filtering, exposure recommendations, multi-night observing windows and telescope control are not included.
- Bright-star data is a bundled upstream sample; deep field imagery requires the external CDS survey service. Survey detail does not predict Mini exposure quality.
- The browser tests use Chrome. Mobile layout was checked with a narrow viewport, not on physical iOS/Android hardware.
- Uses a pinned prebuilt Stellarium fork with matching source; recompilation of the native engine from source has not been performed.

## Framing interaction update

All 8 unit checks and 7 browser checks pass after the update. Additional regressions check that the camera footprint remains centred while panning, Alt-Az stays level, EQ follows celestial north, changing equipment preserves pointing, mount mode persists, and object outlines disappear independently of discovery markers and camera frames. Verified Alt-Az/EQ screenshots with nebula contours hidden. The earlier screenshots and manual angle description are superseded by this update. Exact forward/inverse frame transforms eliminate a small centre displacement from the earlier approximate matrix projection.

## Solar-system update

Added checks for nine solar-system objects, plausible Sun/Moon/planet diameter ranges, spherical disc extent matching the numeric diameter, Moon position and size changing over time, solar-filter guidance, and independent solar/DSO filters with saved visibility. Inspected the Moon footprint against the Mini frame. The current suite has 8 unit tests and 9 browser tests. Surface textures, phase shading, oblateness and Saturn rings are not part of this geometric framing layer.

## Mobile / PWA verification
- Chrome emulated phone: compact toolbar, full-width bottom drawer, swipe expansion, centre-preserving pinch, one-finger pan.
- Full existing browser suite passed after the initial mobile changes; dedicated mobile gesture check also passed.
- Core loads all 12,169 catalogue/solar entries after a network-disabled reload; version-query sky assets served from cache.
- Real optional DSS download completed: 1,022 files, 42.8 MB. Offline reload and a version-query cached survey tile succeeded.
- Cancellation/removal checks passed; source archives excluded from automatic core caching.
- Physical iOS/Android hardware and home-screen installation have not been tested in this environment.
