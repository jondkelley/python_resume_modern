#!/bin/bash
# Renders every downloadable resume format into /pandoc. Needs the flask app on localhost:5001.
# PDF + HTML come from RenderCV; the rest from pandoc.
set -u
HOST=localhost:5001
OUT=/pandoc
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"

curl -sf "http://$HOST/resume.yaml" > resume.yaml &&
  rendercv render resume.yaml -o out -nopng >/dev/null &&
  cp out/*.pdf "$OUT/resume.pdf" && cp out/*.html "$OUT/resume.html" ||
  echo "rendercv failed"

curl -sf "http://$HOST/resume.md/" > resume.md &&
  curl -sf "http://$HOST/static/css/markdown/markdown8.css" > markdown8.css || { echo "markdown fetch failed"; exit 1; }
for f in docx epub odt rst man jira ipynb commonmark biblatex bibtex native latex; do
  ext=$f; [ $f = latex ] && ext=tex
  pandoc --from=markdown --to=$f -s resume.md -c markdown8.css -o "$OUT/resume.$ext" --metadata title=" " || echo "pandoc $f failed"
done
echo "render done"
