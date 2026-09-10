# Equipment presets

Specifications checked against manufacturer pages in September 2026. Presets are native, uncropped telephoto frames; image crops, binning and vendor mosaics can change the delivered field. All dimensions remain editable. Switching presets resets the illustrative mosaic factors to 1×. The factors are planning overlays, not claims about each manufacturer's supported mosaic modes.

- DWARF Mini: existing 2.14° × 1.20° preset. DWARF II: 3.72° diagonal, 16:9. DWARF 3: 3.38° diagonal, 16:9. Draco astronomy mode: 2.059° diagonal, 4:3. [DWARFLAB comparison specifications](https://www.dwarflab.com/us/pages/draco-smart-telescope).
- Seestar S30: 2.46° diagonal, portrait 9:16. [Manufacturer](https://www.seestar.com/products/seestar-s30-all-in-one-smart-telescope).
- Seestar S30 Pro: 4.6° diagonal, 2160 × 3840 portrait. [Manufacturer](https://us.seestar.com/products/seestar-s30-pro).
- Seestar S50: 250 mm focal length, 1080 × 1920 IMX462, 2.9 μm pixels; calculated portrait FOV. [Manual](https://i.seestar.com/owe__prod/static/manuals/SeestarManualEN.pdf).
- Seestar S50 Pro: 2.8° diagonal, 2160 × 3840 portrait. [Manufacturer](https://us.zwoastro.com/products/seestar-s50-pro).
- Vespera Classic: 1.6° × 0.9°. [Vaonis](https://vaonis.com/blogs/travel-journal/vespera-vaonis-newborn-star).
- Vespera Passengers: 2.4° × 1.8°. [Vaonis](https://vaonis.com/pages/vespera-passengers).
- Vespera II: 2.5° × 1.4°. [Vaonis](https://vaonis.com/products/vespera-2).
- Vespera Pro and Pro II: 1.6° × 1.6°. [Pro](https://vaonis.com/products/vespera-pro), [Pro II](https://vaonis.com/products/vespera-pro2).
- Full-frame DSLR: 36 × 24 mm, rectilinear lenses at 24/28/35/50/70/85/100/200/400 mm. Angular width and height use `2 atan(sensor_dimension / (2 focal_length))`. Pixel sampling assumes 6000 × 4000 (24 MP); actual cameras vary.

Diagonal fields are converted using tangent-plane geometry and the stated aspect ratio, rather than treating the diagonal as the frame width. Where output width is not sufficiently specified (Draco and Passengers), pixel sampling is left unknown. Sampling is an approximate angular comparison, not a resolved-detail prediction.
