# Bundled browser libraries

- GSAP and ScrollTrigger **3.13.0**, from `https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/`. Copyright and license notices are retained in each file. License: https://gsap.com/standard-license.
- Three.js **0.169.0**, from `https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js`. MIT license included in `THREE-LICENSE.txt`.
- `CSS3DRenderer.js` is the matching Three.js addon. Its import points to the local Three.js module; all other source is unchanged.

These pinned local copies let the portfolio's interactions load without a runtime CDN dependency. Existing icon fonts and skill icons still use their original external URLs.
