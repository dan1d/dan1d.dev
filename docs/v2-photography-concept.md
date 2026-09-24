# dan1d.dev v2 — "Darkroom": the photographer concept

A second identity for dan1d.dev. Not a portfolio of code with photos bolted on:
a photographer's site first, with the engineer showing through in how it is
built. Daniel shoots on a Nikon D850 as a side project and wants a place to
upload new work himself.

## Prompt for Claude Design

Copy everything below the line into Claude Design.

---

Design a photography website for Daniel Dominguez (dan1d.dev v2). He is a
senior full-stack engineer whose side project is photography on a Nikon D850.
This is his photographer identity, so the site must feel like a photographer's
site first: the pictures are the interface, the engineer shows only in the
craft.

**Concept: "Darkroom."** The site is a darkroom at night. Everything starts in
near-black; images come up out of the dark the way a print develops in the
tray. The site's own light comes from the photographs, not from the UI.

**Mood and references.** Quiet, monochrome chrome, large imagery, generous
negative space, slow deliberate motion. Think a gallery wall in a dark room
with one lamp. No stock textures, no gradients as decoration, no cards with
drop shadows. The only accent color is a warm safelight amber (#F2B441) used
sparingly for state and focus. Type: one serif display face for titles with
real optical character (Fraunces or Instrument Serif), one neutral grotesk for
UI (Inter or Geist), and a monospace only for EXIF data.

**Pages and flows to design:**

1. **Home.** A single full-bleed photograph, edge to edge, with the name set
   small in the corner and the current series title. Scrolling moves through
   the last six photographs one at a time, each developing from black as it
   enters. A thin progress rule on the left shows position in the sequence.
   Bottom of the page: three series tiles and a one-line bio.

2. **Series (gallery).** Masonry that respects each frame's aspect ratio; no
   cropping, ever. Hover reveals title and the essential EXIF as a small
   monospace strip: body, lens, focal length, aperture, shutter, ISO. Click
   opens the lightbox.

3. **Lightbox.** The photograph at maximum size on pure black. Chrome fades
   out after two seconds and returns on pointer movement. Left/right
   navigation, keyboard driven. A collapsible panel for the full EXIF, the
   location if any, and the story behind the frame (one short paragraph).
   A "loupe" mode that lets the viewer inspect a 100% crop, which matters for
   a 45-megapixel D850.

4. **About.** One portrait, a short first-person text, the gear list
   (Nikon D850 plus lenses), and how to reach him for prints or commissions.
   The engineer identity appears here only as a single line linking to the
   code portfolio at dan1d.dev/code.

5. **Upload and manage (private, signed in).** The reason this exists: Daniel
   uploads new photos himself from the D850. Design a drag-and-drop intake
   that accepts RAW-derived JPEG/TIFF exports in batches, shows a per-file
   progress ring, reads EXIF automatically and pre-fills body, lens and
   exposure, lets him add a title, a series, a location and the story, choose
   the cover frame for a series, reorder with drag, and set each photo to
   public or hidden. Include a "develop" review step where the photo is shown
   at full size on black before it goes live. Design the empty state, the
   uploading state, and the error state for a rejected file.

**Interaction language.** Images develop (fade from black with a slight
contrast bloom over about 900 ms), they never slide or bounce. Transitions
between pages are cross-dissolves through black. Motion respects
prefers-reduced-motion by cutting instead of fading.

**Constraints.** Mobile first, one-hand navigation, images served in AVIF/WebP
at responsive sizes, no layout shift as pictures load (reserve aspect-ratio
boxes). Accessibility: every photo has alt text taken from its title and
story; the lightbox is fully keyboard operable and traps focus.

**Deliver:** the design system (color, type scale, spacing, motion tokens),
desktop and mobile screens for all five pages, the lightbox in both chrome
states, and the upload flow in all four states. Show at least one photograph
series end to end.

---

## Notes for when we build it

- Routing: keep the current portfolio at `dan1d.dev/code` (or `code.dan1d.dev`)
  and make the photographer site the new root, or serve it at `photo.dan1d.dev`
  and cross-link. Decide before building; it changes the navigation design.
- Storage: originals to a private bucket (Vercel Blob private or Supabase
  Storage), derived sizes generated once on upload with `sharp`, served
  through `next/image` with `unoptimized` for the derived files so the
  Vercel transformation quota is not hit again (see the gymsratz incident).
- EXIF: read server side on upload with `exifr`; never trust client values.
- Auth for the upload area: a single owner login; magic link or passkey.
- Data model: `photo` (id, series_id, title, story, location, exif json,
  width, height, taken_at, public, sort), `series` (id, slug, title, cover_id).
