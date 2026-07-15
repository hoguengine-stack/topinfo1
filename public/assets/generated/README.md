# Generated home service graphics

These local WebP files are reviewed product-service scenes for the public home stage. Current files combine verified product cutouts, deterministic UI composites, and non-product backgrounds; product models, logos, UI text, and quantities are not generated.

| Asset | Scene |
| --- | --- |
| `system-pos-apexa-x-toss.webp` | POSBANK APEXA X-1500 runs the Toss POS order screen beside a separate Toss Front payment terminal |
| `system-internet-apexa-x.webp` | A router connects the APEXA X running Toss POS, Toss Front, and receipt printer |
| `system-pos-order-payment.webp` | Official Toss Front customer-payment scene, fitted to the 3:2 stage without cropping the terminal |
| `system-internet-connect.webp` | Official U+ router connects verified APEXA X, IP-520GA, and U+ CCTV products |
| `system-ai-phone.webp` | Official white U+ IP-520GA routes common inquiries through an AI assistant bubble |
| `system-cctv.webp` | Four-feed mobile CCTV monitoring, intrusion detection, and field response support |
| `system-internet-phone.webp` | Official white U+ IP-520GA internet-phone product scene |

Build mode: `scripts/rebuild-core-pos-assets.py` composes the POS scenes from the official POSBANK APEXA X-1500 master, the verified Toss POS screen, the official Toss Front cutout, the reviewed AHAPOS CPP-3000 cutout, the reviewed white cash drawer, and the official U+ router cutout. AI generation is limited to product-free tabletop/background material; no generated product silhouette or generated Toss UI is accepted.

Hardware reference: https://www.posbank.com/trans_hardware/apexa-x-1500.php?trans=usa  
Software reference: https://tossplace.com/product/pos

Project copies use exact 3:2 canvases so the responsive stage does not add blank bands or crop at runtime. Rebuilding is deterministic from the archived masters. The internet scene uses the official U+ representative router without asserting an unpublished model name or physical dimension.

The scene layout is illustrative, while the visible products and UI are source-based composites. APEXA X is 364 × 210 × 333 mm, Toss Front is 147.5 × 128 × 193.5 mm, and CPP-3000 is 130 × 178 × 140 mm; same-plane product heights use those ratios. Installation conditions and service scope remain subject to consultation.

The AI-phone scene keeps the official white U+ IP-520GA as the physical device and places the robot only inside a speech bubble. The clock, location, and parking bubbles represent the common inquiries described by the official U+ AI-phone service.

The CCTV scene avoids generated hands and combines a four-feed mobile monitoring screen with official D-1200D, D-1200B, and D-3200PTZD product cutouts. Intrusion detection and mobile alerts are within the official U+ intelligent-CCTV service scope: https://www.lguplus.com/biz/all/telecom/internet-cctv/smart-cctv/B000000007

The revised files passed file-level 100%/400% checks for clipping, alpha edges, product identity, UI legibility, and duplicate content. They remain pending final user review in the actual desktop/mobile page; file-level checks are not recorded as final visual approval.
