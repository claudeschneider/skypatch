# Sky Patch — an interactive sky map for astrophotography planning

Research and planning study, 9 September 2026. “Sky Patch” is a working name.

Implementation update: the camera frame now always follows the viewport centre so users compose by panning. Alt-Az/EQ modes replace manual position-angle input, with ideal alignment and zero fixed sensor roll assumed. Object outlines have an independent visibility toggle. These user-requested changes supersede earlier references below to a saved composition pointing or manual angle control.

## Recommendation

Build a small application around an existing planetarium engine, with full-sky exploration, filtered deep-sky discovery, and accurate framing as its first-release features. Visible-sky masking is deferred: manual polygons in phase two, photo-generated boundaries in phase three. Reuse upstream catalogue data directly. Treat SkyFrame as a source of ideas and selectively reusable modules rather than the default application to fork.

This is a refinement of the previous catalogue-first suggestion. Claude's testing establishes that another good catalogue will not solve the problem: targets must be discoverable while looking around the sky. In phase one, Claude can visually match the map to the balcony view without configuring any obstacle boundaries.

The next engineering milestone should test **Stellarium Web Engine as an embedded map**, not recreate a planetarium. Its source includes custom layers, angular shapes, observer-relative coordinates, celestial coordinates, and HiPS imagery. These are the right primitives. Its compiled distribution, dataset dependencies, and overlay performance need a bounded integration experiment before committing. Aladin Lite remains a strong option for a dedicated photographic framing view if one engine cannot provide both experiences cleanly.

The accompanying interaction study is deliberately independent of this engine decision. It tests discovery, geometry, boundaries, and framing using real catalogue coordinates. It is not the finished application. Its editable boundary is an earlier experiment for later phases, not a phase-one requirement.

## Accepted product decisions

- Laptop planning first; responsive controls for eventual field use.
- The initial observing context is a balcony, but phase one shows the full sky without obstruction masks. Do not assume its compass direction or boundaries.
- The sky map belongs in version one. The full catalogue table can follow.
- Find targets visually through panning and zooming; a name search is a shortcut rather than the required entry point.
- Keep objects discoverable at wide zoom, even if their true angular size is sub-pixel.
- Allow discovery thumbnails and correctly scaled object outlines. Separate marker readability from physical angular size.
- Show full sky imagery around an object, with single-frame and mosaic boundaries drawn over it. Never force the preview to crop at the telescope frame.
- Use survey imagery initially. It represents scale and composition, not expected exposure quality.
- Include surface brightness alongside magnitude, with source, band, units, and missing-data handling.
- Phase two: let users manually draw a rough visible-sky polygon, saved in local horizontal coordinates so it stays fixed as time changes.
- Phase three: generate an editable visible-sky boundary from scope photos. No photo detection, import, or calibration workflow is required for phase one or two.
- Publicly accessible webpage and contributable GitHub source are eventual delivery goals. No repository or deployment has been created in this planning pass.

## What the comparison established

| Candidate | Useful parts | Why it is not the whole solution |
|---|---|---|
| DSO Tonight | Dwarf-specific framing and custom horizons | Claude found that wide views show constellations without enough target discovery. |
| AstroPlanner | Catalogue filters, FOV fit, surface brightness and night scoring | Claude found the target image cropped to the scope view; discovery remains list-based. The signed-in interface was inspected read-only. |
| SkyFrame | Public source, catalogue integration, site profiles, planning windows, same-field suggestions | No immersive map in the reviewed interface. Several assumptions need changing for the Mini; see the code audit below. |

This finding does not imply that the products cannot improve or expose additional features. It identifies the gap in the tested workflows.

## Why not simply fork SkyFrame?

The inspected revision is `a7744a4e77dc691b8bf7141971a8b24c8d845e28`. Its 44 existing tests passed locally. That establishes a working baseline for those tests; it does not validate the suitability of its recommendations for a Dwarf Mini.

The code audit found:

1. **Exposure and gain are not a Mini recommendation model.** The object modal assigns eight minutes to emission targets and four minutes to other targets, with a literal gain/offset display of `100 / 50`. These cannot be adopted as device-specific settings. [Source](https://github.com/sparrowjack63/SkyFrame/blob/a7744a4e77dc691b8bf7141971a8b24c8d845e28/js/ui/modal.js)
2. **The basic angular-size score is fixed.** It increases from a 3.4′ threshold to a 120′ maximum without reading the instrument's current FOV. Emission nebulae also receive a fixed surface-brightness component rather than a measured one. [Source](https://github.com/sparrowjack63/SkyFrame/blob/a7744a4e77dc691b8bf7141971a8b24c8d845e28/js/catalog/scoring.js)
3. **Catalogue loading already removes targets.** The parser excludes some faint/small objects and applies sampled site visibility before returning the catalogue. It caches the processed result under one catalogue key. Our application should preserve the source catalogue and make the active visibility/filter decisions explicit and reversible. [Source](https://github.com/sparrowjack63/SkyFrame/blob/a7744a4e77dc691b8bf7141971a8b24c8d845e28/js/catalog/load.js)
4. **Useful shape data is lost.** The parser reads major and minor axes but the returned object retains a single size; it does not retain position angle. It combines open and globular clusters into one type. Those choices conflict with the requested outlines and separate filters. Same source as above.
5. **The obstacle model is specialized.** It supports altitude/azimuth limits and two analytic overhang constraints, not arbitrary image-traced openings. [Source](https://github.com/sparrowjack63/SkyFrame/blob/a7744a4e77dc691b8bf7141971a8b24c8d845e28/js/astro/core.js)

The data organization, alias handling, grouped compositions, and planning-window concepts are worth learning from. The editorial ratings require independent review: many refer to another field of view, filters, or preferences.

Forking remains reasonable if retaining SkyFrame's full planner and contributing a new map to it becomes a priority. For the current brief, a smaller map application avoids adapting its UI, data reduction, scoring, and geometry simultaneously.

If code or editorial data is copied, retain its notices and AGPL obligations. The cleaner catalogue route is OpenNGC directly, with its separate CC BY-SA attribution and source lineage. Do not assume an application's code licence also licenses all third-party images it displays.

## First-screen experience

The opening screen should be the sky, not a landing page. Its layout:

- Full-sky interactive map with stars, deep-sky objects, a compass/elevation grid, and the astronomical horizon. No building or visible-sky masking in phase one.
- Compact location/date controls and an obvious “Now” reset.
- A time slider under the map.
- A slim panel for filters and the selected object's detail.
- A wide-view reset and “Frame target” to inspect a selected composition. A saved-opening shortcut can follow in phase two.

At wide zoom, show image markers with stems anchored to the object's actual coordinates. Keep a minimum-size dot underneath. Declutter overlapping labels, but retain a way to find every included object—grouped markers should show their count and expand on selection.

At close zoom, show survey imagery and the object's sourced extent. The camera footprint must be projected from angular sky coordinates; it must not be a fixed CSS rectangle. Borders may appear rotated or curved in a very wide projection.

The map's free look direction and the telescope's planned pointing are distinct. Panning the map must not silently move a saved composition. Selecting a target recentres the view; dragging a framing box is an explicit composition edit.

“Frame target” must fit both the object extent and active mosaic footprint, including vertical space and rotation. “Fill screen with telescope frame” can be a separate explicit view later.

## Field of view, orientation, and mosaics

Working preset: 1920 × 1080 pixels; 2.14° horizontal × 1.20° vertical. The previously quoted 2.45° is the diagonal. Use these rounded published values as an editable preset in phase one. Calibration from an uncropped, solved exposure can follow later and does not block the first release. [Specification table](https://usa.all-startelescope.com/products/dwarflab-dwarf-mini-smart-telescope-dwarf-mini)

Approximate sampling is 4.0125 arcsec/pixel horizontally and 4.0 vertically. A mosaic expands sky coverage at approximately the same underlying sampling; it does not reveal more detail in a small object merely by adding panels. Final exported dimensions and stacking crops must be checked against a real output.

The official Mini manual describes a maximum **1.8 × 1.8 overall composition**, using two panels along each expanded dimension and at most four panels. On this preset that is about **3.852° × 2.16°**. This means 1.8 times each full dimension, not adding 1.8 frames outside each edge. [Mini manual, Astro Mosaic](https://help.dwarflab.com/en/docs/DWARF-mini-Smart-Telescope-User-Manual)

Expose width and height independently in the application, from 1.0 to 1.8 for the built-in preset. Show the single frame, total composition, and optionally individual panels/overlap. A separate custom-grid mode can support larger manual mosaics. Panel count, overlap, and usable time per panel matter more than an arbitrary overall “fit” score.

The experiment uses a north-up sky frame, visibly labelled. Production framing must distinguish a requested composition angle from the Mini's achievable camera orientation. Do not imply a freely commanded physical rotator. Phase one can provide an accurate angular composition preview with a clearly labelled orientation assumption and manual angle control. Later validation of EQ mode, actual output orientation, and the device workflow is needed before declaring a framing plan executable on the telescope; sample images are not a prerequisite for the initial map.

## Interpreting Claude's five example targets

The following long-axis estimates use the inspected OpenNGC dimensions and the working horizontal sampling. They describe geometric extent, not visible detail:

| Target | Catalogue long axis | Approximate pixels across | Design implication |
|---|---:|---:|---|
| M57, Ring Nebula | 1.27′ | 19 | Remains a discovery dot at wide zoom and a genuinely tiny target inside a frame. |
| M51, Whirlpool Galaxy | 13.71′ | 205 | Avoid an enlarged thumbnail implying a frame-filling galaxy. |
| M101, Pinwheel Galaxy | 23.99′ | 359 | Larger extent than M51 does not guarantee clearer spiral structure. |
| C27 / NGC6888, Crescent Nebula | 20′ | 299 | Claude liked this despite its moderate size; size alone cannot encode satisfaction. |
| NGC7000, North America Nebula | 120′ | 1,794 | Preserve the broader contour and surrounding composition; accommodate mosaics. |

Catalogue axes and photographic outlines can disagree because they describe different boundaries or brightness levels. OpenNGC's NGC7000 row has a 120′ × 30′ entry, while its separately traced contour covers a broader region. Keep both with their provenance; never stretch an image to force agreement with a single diameter. OpenNGC's Veil-related rows also illustrate parent-complex versus individual-component ambiguity.

These targets are acceptance examples, not enough observations to train a reliable personalized quality model. Later, record “liked result,” “too small,” “too faint,” and the actual conditions to improve suggestions transparently.

## Filters and honest recommendations

Version-one filters should include object class, altitude, angular size, frame-fill range, magnitude, available surface brightness, and an above-horizon toggle at the selected location and time. Filtering against a user-drawn opening belongs to phase two. Keep open and globular clusters separate, and distinguish emission, reflection, dark and planetary nebulae plus supernova remnants.

Preserve band information rather than silently treating B and V magnitudes as identical. OpenNGC's galaxy `SurfBr` is mean B-band brightness within the 25-mag isophote, in mag/arcsec². It is not universally available for nebulae. [Field guide](https://github.com/mattiaverga/OpenNGC/blob/da90466031b0372c896588b85be6016c617e205b/NGC_guide.txt)

Use null for unknown measurements. A missing surface brightness must not silently remove desirable nebulae. Offer an explicit “include unknown values” option for numerical filters. If an average is estimated from magnitude and area, label it as derived and preserve the chosen band/extent. Never mix a derived average with a measured isophotal value under an unqualified number.

Start with visible reasons rather than a single opaque score: “altitude 45°,” “19 pixels across,” “requires mosaic,” “Moon 50° away,” “surface brightness unknown.” Any later score should expose separate accessibility, framing and expected-contrast components.

Moon separation needs the Moon's altitude and illumination as context. A building hiding the Moon does not remove moonlight scattered through the sky. Directional glare zones, if added later, should be user-defined penalties, distinct from hard obstacle exclusions; neither belongs in phase one. Avoid claiming an accurate exposure time or gain from a broad quality score.

When filtering produces zero results, explain which constraints removed the candidates and provide reversible relaxations. Search should still find an excluded object and say why it is excluded.

## Phase three research: photo-assisted boundary capture (deferred)

This section records future feasibility findings only. Do not implement photo detection, request scope photos, or make photo calibration a dependency of the first two phases.

The proposal is technically plausible, but **centre RA/Dec and FOV alone are insufficient**. Mapping each pixel requires orientation/roll, projection, image dimensions, and possibly lens distortion. A full World Coordinate System calibration supplies those relationships. [NASA FITS WCS](https://fits.gsfc.nasa.gov/fits_wcs.html)

Recommended workflow:

1. Import an original wide-camera image taken from the telescope's normal balcony position. Keep capture time with an unambiguous timezone and site coordinates.
2. Inspect metadata. Prefer a valid WCS solution if present; do not assume Mini JPEGs or FITS contain it merely because the telescope plate-solves internally.
3. If enough stars are visible, plate-solve the image to recover sky position, scale, rotation and distortion. Astrometry.net provides a documented API and calibration/WCS outputs; a local solver or user-supplied solved file is also possible. No personal image was uploaded during this research. [API documentation](https://astrometry.net/doc/net/api.html)
4. Trace the clear-sky region in image pixels. Allow automatic sky segmentation as an editable suggestion, not the only path. Low-light skyline detection and star recognition are separate problems.
5. Convert each traced pixel through WCS to celestial coordinates, then to local azimuth/elevation using the capture time and observing location.
6. Save the resulting horizontal boundary with a configurable clearance margin and calibration confidence. Sky positions update with planning time; the boundary does not.
7. Validate against several identifiable landmarks/stars before calling a target unblocked.

If a nighttime image has stars but an unreadable skyline, a twilight skyline image from the same fixed pointing can help. It still needs registration; changing telescope pointing, tripod position, cropping, or camera orientation prevents assuming the two images align. Near balcony obstructions are particularly sensitive to moving the observing position.

If only the telephoto view can be solved, converting it to the wide view needs a calibrated relationship between the two cameras. Do not assume their centres or roll match. DWARFLAB's manual includes a wide/tele frame-alignment procedure, which reinforces this concern.

A saved opening polygon handles the balcony's left/right walls and upper overhang; a simple minimum-altitude skyline is not sufficient. Eventually allow multiple openings and exclusion holes. An unknown region should remain “not surveyed,” not automatically “clear.”

For a static implementation in phase three, a practical initial import path is an already-solved image plus its WCS/sidecar file and local tracing. Automatic remote solving can be added later with explicit photo-upload and service handling. Device connection and automatic live capture are separate later work.

## Later visibility checks, after manual polygons

Phase one computes astronomical positions and above-horizon filtering only; it makes no claim that a target is unobstructed from the balcony. Once phase two provides an opening, evaluate visibility at the selected instant and over an intended integration window. Keep separate answers for:

- Object centre inside the opening.
- Desired target extent inside the opening.
- Entire single-frame footprint inside the opening.
- Every planned mosaic panel clear during its assigned capture interval.

Checking the centre or four corners is insufficient for concave obstacles, interior exclusion holes, and wide mosaics. Use boundary intersection/containment in a spherical representation or carefully bounded local projection, plus conservative sampling across time. Refine transition times rather than presenting coarse five-minute samples as exact seconds.

The full application must account consistently for J2000 versus current-epoch coordinates, UTC/site timezone, geometric versus refracted horizon coordinates, and wraparound at north. A safety margin belongs to the measured site's uncertainty, not as a substitute for these calculations.

## Technical architecture to evaluate

| Layer | Proposed foundation | Decision gate |
|---|---|---|
| Local sky rendering | Stellarium Web Engine | Reproducible build; celestial object and FOV overlays; stable selection/panning; acceptable laptop/mobile performance. |
| Photographic framing | HiPS in the same engine; Aladin Lite if a separate view is clearer | Accurate sky projection, rotation, uncropped context, source credits, loading/error handling. |
| Astronomy calculations | Astronomy Engine or engine-provided transforms behind one tested adapter | Agreement at fixed test locations/times; no mixing coordinate epochs or refraction conventions. |
| Catalogue | Pinned OpenNGC + addendum + reviewed supplemental nebulae | Preserve axes, position angles, aliases, types, units, nulls and source identifiers. |
| Site model | Phase one: observing location and timezone. Phase two: manual horizontal opening polygon. Phase three: photo-assisted boundary generation. | No obstruction model in the initial integration gate. Validate polygon wraparound and containment when phase two begins. |
| State | Shared site/time/equipment/filter/selection state | Map and later table agree; camera view is separate from planned pointing. |
| Persistence | Browser-local site profiles, exported/imported JSON | Versioned schema and migration; private coordinates absent from public repository defaults. |
| Hosting | Static web build, compatible with GitHub Pages or another static host | No secret keys in the client; licence and attribution inventory; public clean-install instructions. |

Stellarium is the stronger conceptual match for a view anchored to the observer and horizon. Aladin Lite's documented displayed coordinate frames are equatorial/ICRS and galactic; a local sky/horizon experience would need extra work. Avoid synchronizing two entire renderers unless the single-engine experiment demonstrates a real need.

HiPS images are delivered as tiles; catalogue previews can use modest cutouts or a shared renderer. Do not allocate one active WebGL instance per table row. Record each survey's attribution and reuse terms; availability through a public service does not erase the underlying image terms. Show loading or an outline fallback when a tile/cutout fails.

## Staged delivery and acceptance gates

### Phase one — full-sky planetarium, filters and accurate FOV previews

Start with a bounded engine integration experiment: embed the chosen planetarium with a pinned source/distribution, draw a celestial camera frame, and place the five example targets. Verify pan through 360°, zoom to sub-degree scale, location/time changes, object picking, and survey imagery with uncropped context. Document data endpoints and runtime dependencies, then decide whether to adopt, adapt, or switch the renderer. No horizontal opening, obstacle mask, or photo processing is part of this gate.

Deliver arbitrary location/date/time, a useful deep-sky catalogue on the map, discoverable markers or thumbnails, true-size outlines with minimum-size dots, survey imagery, and single-frame/mosaic overlays. Include the type, altitude/horizon, size/frame-fill, magnitude and available surface-brightness filters described above, with missing-value controls and explanations for empty results.

Acceptance criteria:

- Interesting objects remain findable while panning a wide view, without knowing their names first.
- Objects, survey imagery and telescope footprints retain consistent angular scale through deep zoom.
- “Frame target” shows the full object and active footprint with surrounding context, including large nebulae extending outside a single exposure.
- The Mini preset uses 2.14° × 1.20°, with independent mosaic width/height up to 1.8 times each dimension and a clearly stated orientation assumption.
- Location and time changes update the sky and filters consistently. The above-horizon filter refers to the astronomical horizon, not local buildings.
- Claude can plan a session without drawing a polygon, providing balcony measurements, or importing a scope photo.

### Phase two — manually drawn visible-sky polygon

Let the user draw, edit, clear and save a rough polygon on the map to indicate the viewable sky. Store it in local azimuth/elevation coordinates so buildings and the opening stay fixed while the sky moves. Offer optional filtering against this opening and a shortcut to return to it. Make clear that this is a user-estimated boundary, not verified obstruction clearance.

Validate north wraparound, upper overhangs, persistence, and consistent filtering as planning time changes. Start with a single opening; more complex exclusions and full-frame/session-clearance checks can follow as needed. This phase does not import, analyze or detect boundaries from photos.

### Phase three — visible-sky boundaries generated from scope photos

Add photo-assisted boundary generation using the calibration workflow recorded above. First validate the metadata and geometry available from real Mini images; then implement a suitable import/solving path and editable sky-boundary suggestions. Require user review of the result and preserve calibration uncertainty. Neither of the earlier phases depends on this succeeding.

### Independent later additions

The catalogue table can be prioritized separately; it does not need to wait for photo processing. Include medium-sized previews, common name, catalogue aliases, magnitude, angular axes, constellation and optional surface brightness. Offer explicitly labelled preview modes: fixed telescope-scale thumbnails for comparison, and full-object context with scope box for composition.

Other additions include continuous observing windows, frame/panel clearance once polygons exist, Moon context, a shortlist, multiple sites, custom manual mosaics and mobile refinement. Public hosting and contribution documentation can accompany the first usable release; publish only non-private defaults.

Weather, device control, automated sequencing, cloud accounts and community image uploads should not delay the initial planetarium.

## What this pass actually delivered

The following describes the earlier research concept, not the revised phase-one scope. Its polygon controls demonstrate deferred work and do not imply that masking is required in the first release.

- Read-only inspection of the signed-in AstroPlanner interface, plus public documentation and source review.
- Pinned local source audits for SkyFrame, Stellarium Web Engine, OpenNGC and d3-celestial.
- 44 passing upstream SkyFrame tests, without modifying that repository.
- An interactive in-conversation map study with 121 targets, 3,596 stars, 89 constellation line sets, and 97 five-minute sky rotations across one example night.
- Real sourced nebula contours where available, otherwise explicitly approximate catalogue ellipses.
- Pan, zoom, object selection, type/size/patch filters, editable opening, time slider, and single-frame/1.8× mosaic footprints.
- Seven geometry tests, including north wraparound, near-pole framing, projection round trips and agreement with Astronomy Engine's horizontal transform.

Limits: the study is fixed to a coarse Vancouver example and one night; it has no photographs, persistent site storage, photo import/solving, live telescope connection, comprehensive filtering, frame-clear session calculation, or actual Mini orientation calibration. Its custom canvas is an interaction experiment, not a commitment to write a production renderer.

## Inputs needed next

No further design interview, balcony measurements, or scope photos are needed before the phase-one engine integration experiment. The app should let users enter their own observing location and time; the research concept’s coarse Vancouver location is only an example.

In phase two, the user can draw the rough opening directly on the map. Only when phase three begins should we request original scope images, capture times and calibration metadata. Optional later FOV/orientation calibration must not delay the full-sky map and published equipment preset.
