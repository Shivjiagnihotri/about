# Video preview covers

These images identify the free video lectures and selected video courses linked from the Learning Garden. Source thumbnails remain the property of their respective creators. Each image links to its original video or course page in the interface.

`../catalogue/video-covers.json` records the destination, original image URL, source title, check date, local filename, and cover type. Images marked `source-thumbnail` come from the source page's public social preview. They are not screenshots captured from inside a video. Images marked `original-illustration` are botanical title cards generated for this site when a source preview is unavailable.

Refresh with `node scripts/collect-video-covers.mjs`, then `npm run catalogue:build`. Books, videos, and course content are not hosted here.
