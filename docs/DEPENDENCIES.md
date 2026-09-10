# Engine integration decision and dependency provenance

The phase-one integration gate passed with Stellarium Web Engine. The main sky, observer transforms, stellar rendering, HiPS imagery and native pan/zoom use this engine. A small canvas overlay uses its ICRF→VIEW transform and matching stereographic projection for catalogue dots, contours and TAN camera footprints. Astronomy Engine computes Sun altitude for the day/twilight label. The prototype's fixed nightly rotation table is not used.

The upstream project requires legacy Emscripten to compile. This implementation vendors the **unmodified prebuilt fork** by juma-sayeh at `1ca0821def239f2b94c0b9210269d56ea929a480`, including its corresponding source archive. That fork documents a compatibility adjustment for a public star-service property. We use bundled bright-star data instead of depending on that star CDN.

- Engine source: https://github.com/juma-sayeh/stellarium-web-engine-prebuild/tree/1ca0821def239f2b94c0b9210269d56ea929a480
- Upstream sky samples and fonts: https://github.com/Stellarium/stellarium-web-engine/tree/e7201246bdf7289c50a3ec59e98f69f0f9383b05/apps
- OpenNGC catalogue/addendum/outlines: https://github.com/mattiaverga/OpenNGC/tree/da90466031b0372c896588b85be6016c617e205b
- Astronomy Engine 2.1.19 (npm lockfile), MIT: https://github.com/cosinekitty/astronomy
- DSS2 colour HiPS: https://alasky.cds.unistra.fr/DSS/DSSColor
- DSS cutout API: https://alasky.cds.unistra.fr/hips-image-services/hips2fits

To reproduce the catalogue, obtain the pinned OpenNGC checkout and run `python3 scripts/build-catalogue.py /path/to/OpenNGC`. This derives a JSON catalogue retaining nulls, axes, available position angles, aliases and photometric bands. It selects deep-sky types, omits duplicate/nonexistent and individual-star records, and simplifies contour traces to a bounded number of points. It applies no observing-site or magnitude cut. The C27 alias and a few familiar common names are explicit supplements in the importer.

To restore the engine, extract the supplied `public/source/stellarium-engine-source.tar.gz` and copy its `build/stellarium-web-engine.{js,wasm}` to `public/vendor/`. Its README documents rebuilding using Emscripten 1.40.1 and SCons. The supplied binary is used as-is; compilation with modern Emscripten has not been claimed or tested.

To restore local sky samples, copy `apps/test-skydata/{stars,skycultures,surveys}` and `apps/web-frontend/public/fonts` from the pinned official upstream revision into their matching `public/` folders. Checksums of the delivered binary, source archive and derived catalogue are in CHECKSUMS.json.

## Scientific conventions

Catalogue coordinates are equatorial ICRF/J2000; the engine converts them using the selected observer and UTC. Atmospheric rendering is off, making this a geometric planning view. Horizon filtering uses OBSERVED_GEOM. The viewport uses stereographic projection with the engine's smaller-screen-dimension FOV convention. Camera outlines use a tangent-plane (TAN) footprint on the celestial sphere. The frame centre is the inverse-projected viewport centre. Alt-Az frame-up follows local zenith; EQ frame-up follows the celestial pole of date. Exact engine transforms project camera vertices and refine visible objects at deep zoom, avoiding the aberration error of a basis-vector shortcut. Both modes assume zero fixed sensor roll; composition position angle is east of celestial north. No physical field-rotation/exposure simulation is performed.

Photometric values are passed through without converting unlike bands. Null measurements remain null. No invented exposure, gain or quality recommendation is included.

## Licence/source availability

The credits page links the bundled app source, the exact engine source archive and upstream OpenNGC. Both source downloads are included in static output. External imagery is streamed with DSS/STScI/NASA/CDS credit; its captured service properties and acknowledgement are supplied unchanged. The HiPS service declares ODbL-1.0 for its database; original plate credits and image terms remain applicable. See public/licenses.

## Solar-system layer

Positions, observer-dependent radius/distance ratio, magnitude and illuminated fraction come directly from the pinned Stellarium engine (`getInfo` on `NAME sun`, `NAME moon`, etc.). Angular diameter is `2 asin(radius/distance)`. Directions use the same engine coordinate transforms as the camera frame; body records refresh when time or location changes. Full-disc extents are spherical circles, with approximate Mini sampling based on the current frame width. No DSS cutouts are used for moving bodies. Native planetary rendering is hidden to avoid confusing magnitude-based points or artificial Moon enlargement with geometric size. Displayed discs are explicitly footprint diagrams, not phase or surface renderings.
