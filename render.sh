#!/bin/bash
# Renders every downloadable resume format into /pandoc. Needs the flask app on localhost:5001.
# PDF + HTML come from RenderCV; the rest from pandoc.
set -u
HOST=localhost:5001
OUT=/pandoc
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"

# one PDF per RenderCV theme: resume.pdf is ember, the rest are resume-<theme>.pdf (shift-click PDF on the site picks one)
curl -sf "http://$HOST/resume.yaml" > resume.yaml || echo "resume.yaml fetch failed"
for theme in ember classic engineeringclassic engineeringresumes harvard ink moderncv opal sb2nov; do
  { cat resume.yaml; printf '\ndesign:\n  theme: %s\n' "$theme"; } > "cv-$theme.yaml" &&
    rendercv render "cv-$theme.yaml" -o "out-$theme" -nopng >/dev/null &&
    cp out-$theme/*.pdf "$OUT/resume$([ $theme = ember ] || echo "-$theme").pdf" || echo "rendercv $theme failed"
  [ $theme = ember ] && cp out-$theme/*.html "$OUT/resume.html"
done

curl -sf "http://$HOST/resume.md/" > resume.md &&
  curl -sf "http://$HOST/static/css/markdown/markdown8.css" > markdown8.css || { echo "markdown fetch failed"; exit 1; }
for f in docx epub odt rst man jira ipynb commonmark biblatex bibtex native latex; do
  ext=$f; [ $f = latex ] && ext=tex
  pandoc --from=markdown --to=$f -s resume.md -c markdown8.css -o "$OUT/resume.$ext" --metadata title=" " || echo "pandoc $f failed"
done
echo "render done"
