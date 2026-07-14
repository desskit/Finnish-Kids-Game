# Journey-map backdrops

Drop the two backdrop illustrations here (WebP), named **exactly**:

- `path.webp` — portrait backdrop (phones, tablets held in portrait)
- `path-wide.webp` — wide/landscape backdrop (iPad landscape, Fold unfolded)

They're referenced by `MapHome` via `import.meta.env.BASE_URL` and styled in
`src/styles/global.css` (`.map-home::before`). Until they exist, the map falls
back to the flat `--sky` colour, so nothing breaks.

**Upload via the GitHub web UI:** open this folder on the `claude/gallant-volta-ymbf4d`
branch → **Add file → Upload files** → drag both WebPs in → **Commit** to this branch.
(If your files aren't named `path.webp` / `path-wide.webp`, upload them anyway and
tell Claude the names — they can be renamed in the repo.)
