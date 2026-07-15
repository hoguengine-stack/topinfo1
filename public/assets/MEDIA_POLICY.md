# Public media acceptance policy

Every public-facing image must pass this checklist before it is referenced by CMS defaults or product data.

1. Record the original source and the partner-approved usage scope.
2. Do not use an identifiable person without documented advertising and portrait-use permission.
3. Use a transparent product cutout only when its alpha edge is clean. Otherwise present the source inside an intentional white product stage.
4. Reject white matte boxes, color spill, visible extraction halos, watermarks, unrelated stock photography, and unreadable low-resolution enlargements.
5. Assign separate visual roles for hero, package, detail, and compact cards. Do not reuse the same composition in adjacent sections.
6. Use the paths in `src/utils/publicMedia.ts` for standard homepage media so later partner originals can be replaced centrally.
7. Keep CMS-selected custom media unless it is on the explicit retired-media list.
8. Provide meaningful alt text and stable dimensions in the consuming component.

Current rights status:

- LG U+ and Toss Place files are local copies of official public product media with source URLs recorded in each asset directory.
- Direct-agency redistribution rights still require confirmation against the partner agreement or media kit before production publication.
- The retired LG U+ employee portrait must not be restored without written permission.
- The two Toss lineup files with baked black backgrounds remain source references only. Default CMS sections use code-rendered service graphics instead, avoiding visible matte boxes, embedded portraits, and repeated compositions.
