# Generated public graphics

Only non-product decorative material that is explicitly registered below may remain in this directory.

All former `system-*.webp` product/service composites were removed from `public/` on 2026-07-18 and archived under `.asset-research/rights-pending/public-blocked/generated/`. They failed the combined product-fidelity, composition, or publication-rights gate. The homepage now renders code-based service scenes from individually registered source assets instead of publishing those flattened composites.

`scripts/rebuild-core-pos-assets.py` writes any rebuilt system composite to `.asset-research/rights-pending/`; it must not write `system-*` files back into this public directory. `src/utils/publicMedia.ts` and `src/utils/cmsMediaAudit.test.ts` enforce the same rule at runtime and in tests.

Hardware and software references retained for future verified work:

- POSBANK APEXA X-1500: https://www.posbank.com/trans_hardware/apexa-x-1500.php?trans=usa
- Toss POS: https://tossplace.com/product/pos
- U+ intelligent CCTV: https://www.lguplus.com/biz/all/telecom/internet-cctv/smart-cctv/B000000007

Reintroducing a composite requires exact model and UI evidence, measured physical scale, coherent lighting/perspective, partner redistribution rights, and rendered-page approval under `.agents/skills/topinfo-design-review/SKILL.md`.

## Generated Asset Register

The following files are internally generated visual material. They are not customer photos, installation evidence, official product media, or proof of a service feature. Their original generation prompts were not preserved in the earlier work history, so that fact is recorded rather than reconstructed.

| Asset | Public role | Generation/source record | Rights and evidence boundary | Active page |
| --- | --- | --- | --- | --- |
| `topinfo-package-owner-v2.webp` | Decorative store-owner background behind verified product cutouts | Internal legacy generation, 2026-07-15; original prompt unavailable | Project-controlled generated image. Must be captioned as an illustration and must not imply a real customer or installation case. | Home package campaign |
| `.asset-research/generated-source/uplus-ai-robot-white.png` | Source master for the decorative robot inside the AI speech bubble | Internal legacy generation, 2026-07-15; original prompt unavailable | Stored outside `public/`. Decorative metaphor only; it must never replace official product or service evidence. | Research source only |
| `uplus-ai-robot-white-384.webp` | Optimized derivative of the decorative robot | Deterministic resize of the source master to 384×576, WebP | Same restriction as the source master. | Home system stage, U+ AI전화 page |
| `.asset-research/generated-source/cctv-store-grid-person-free.png` | Source master for an illustrative four-feed store monitor | Internal legacy generation, 2026-07-14; original prompt unavailable | Stored outside `public/`. Not a real store, customer, installation, or official U+ app screen. | Research source only |
| `cctv-store-grid-person-free-480.webp` | Optimized derivative of the illustrative CCTV feeds | Deterministic resize of the source master to 480×960, WebP | Must be labeled as a monitoring example and paired with separately sourced product cutouts. | Home system stage |

The deployed derivatives are 25,582 bytes and 75,526 bytes respectively. Source masters remain in `.asset-research/generated-source/` for traceability and are excluded from the public deployment tree.
