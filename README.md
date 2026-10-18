# Palladium Vogue — Website Preview (Phase I)

Visual sample of the Palladium Vogue homepage for client review — *Editorial Wireframes & Art Direction*.

**Timeless. Elegant. Intelligent.** A luxury technology brand experience inspired by a private Milan showroom.

## What's here
- `index.html`: single-page cinematic homepage following the blueprint site map (Philosophy, Platform, Experience, FELIX, Private Members, Journal, Company, Download App)
- `assets/css/style.css`: design tokens from the blueprint (Deep Onyx `#0B0B0D`, Charcoal `#18181B`, Warm Ivory `#F5F3EF`, Champagne Gold `#C6A86A`, Stone Gray `#8E8E93`, Emerald `#2E8B57`), with Cormorant Garamond and Inter
- `assets/js/main.js`: subtle fade/slide reveals, solid-on-scroll nav, and the mobile menu
- `assets/images/`: editorial imagery generated with Google Flow (Nano Banana), no stock photography

- `assets/logo/`: the PV Interlace logo (monogram, seal, stacked and horizontal lockups in gold, ivory and onyx), the Ligature alternative, and `logo-concepts.png`. The SVGs are built from Cormorant Garamond outlines by `build_logo.py`. The site uses the circled mark (`pv-interlace-circle-{gold,ivory,onyx}.svg`, `pv-interlace-horizontal-circle-gold.svg` and `favicon.svg`), generated from the plain marks by `tools/circle_marks.py`

- `assets/js/hero3d.js`: real-time 3D FELIX bottle for the hero (Three.js 0.160 from jsDelivr), with a studio environment, gold-foil label, gold dust, cursor-follow and scroll turn. It falls back to `assets/images/felix-bottle.png` (transparent cutout) without WebGL and holds still under reduced-motion. Add `?still` to the URL for a static frame
- `assets/js/silk.js`: fine, sheer silk ribbons drifting in a slow wind behind and around the hero bottle, in champagne gold, ivory and black satin with a gold selvedge. They render in the same Three.js scene; the wind (layered travelling waves and a twist along each ribbon) runs in the vertex shader, and the silk look comes from `MeshPhysicalMaterial` with sheen and anisotropy. The ribbons unfurl on load and follow the mouse: resting the cursor over them parts the silk around it, and sweeping across drags the ribbons along and sets them rippling (measured on screen, so ribbons at every depth react right under the pointer; touch-drag works too). They lift away on scroll, flutter harder when the curtain's gust blows, and fade out softly where the stage ends so the showroom photo stays visible. Phones get 3 lighter ribbons instead of 5. Reduced-motion and `?still` both show the same composed frame
- `assets/js/curtain.js`: a sheer white chiffon curtain hung from a rod along the top of the hero's left edge, behind all the text. It stays invisible until a strong gust blows it into the room from the left: the cloth swings right in a soft S, twisting so it gathers at the waist and flares open at the end, with bright rolled edges and gauze-like layers (screen blending, brighter where it folds edge-on). Gusts come every 60 seconds and on every click in the hero; then it settles back and fades away. It shares the hero's single WebGL canvas, which now spans the whole hero: the curtain is drawn across it and the bottle scene into the stage's rectangle. It is off under reduced motion; `?still&curtain` freezes it mid-gust for screenshots
- `assets/images/felix-parfum.jpg`: the product photo with the circled PV mark and FELIX foil label (label layout in `assets/logo/tools/felix-label.html`)

The app and Private Members dashboard screens are built in HTML/CSS so they stay crisp at every size.

## Run locally
```bash
python -m http.server 5510
```
Then open http://localhost:5510.

---
Client: Felix (Palladium Vogue) · Lead Designer: Irvin
