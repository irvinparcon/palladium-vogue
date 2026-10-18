# Palladium Vogue — Website Preview (Phase I)

Visual sample of the Palladium Vogue homepage for client review — *Editorial Wireframes & Art Direction*.

**Timeless. Elegant. Intelligent.** A luxury technology brand experience inspired by a private Milan showroom.

## What's here
- `index.html`: single-page cinematic homepage following the blueprint site map (Philosophy, Platform, Experience, FELIX, Private Members, Journal, Company, Download App)
- `assets/css/style.css`: design tokens from the blueprint (Deep Onyx `#0B0B0D`, Charcoal `#18181B`, Warm Ivory `#F5F3EF`, Champagne Gold `#C6A86A`, Stone Gray `#8E8E93`, Emerald `#2E8B57`), with Cormorant Garamond and Inter
- `assets/js/main.js`: subtle fade/slide reveals, solid-on-scroll nav, and the mobile menu
- `assets/images/`: editorial imagery generated with Google Flow (Nano Banana), no stock photography

- `assets/logo/`: the PV Interlace logo (monogram, seal, stacked and horizontal lockups in gold, ivory and onyx), the Ligature alternative, and `logo-concepts.png`. The SVGs are built from Cormorant Garamond outlines by `build_logo.py`

- `assets/js/hero3d.js`: real-time 3D FELIX bottle for the hero (Three.js 0.160 from jsDelivr), with a studio environment, gold-foil label, gold dust, cursor-follow and scroll turn. It falls back to `assets/images/felix-bottle.png` (transparent cutout) without WebGL and holds still under reduced-motion. Add `?still` to the URL for a static frame
- `assets/js/silk.js`: silk ribbons drifting in a slow wind behind and around the hero bottle, in champagne gold, ivory and black satin with a gold selvedge. They render in the same Three.js scene; the wind (layered travelling waves and a twist along each ribbon) runs in the vertex shader, and the silk look comes from `MeshPhysicalMaterial` with sheen and anisotropy. The ribbons unfurl on load and follow the mouse: resting the cursor over them parts the silk around it, and sweeping across drags the ribbons along and sets them rippling (measured on screen, so ribbons at every depth react right under the pointer; touch-drag works too). They lift away on scroll, and fade out softly where the canvas ends so the showroom photo stays visible. Phones get 3 lighter ribbons instead of 5. Reduced-motion and `?still` both show the same composed frame
- `assets/images/felix-parfum.jpg`: the product photo with the PV mark and FELIX foil label (label layout in `assets/logo/tools/felix-label.html`)

The app and Private Members dashboard screens are built in HTML/CSS so they stay crisp at every size.

## Run locally
```bash
python -m http.server 5510
```
Then open http://localhost:5510.

---
Client: Felix (Palladium Vogue) · Lead Designer: Irvin
