#!/bin/bash
# periodically renders resume.pdf and resume.html with RenderCV into the volume shared with flask

# wait for flask app startup
sleep 5

while true; do
  echo "$(date -u) -- Generate resume"
  tmp_dir=$(mktemp -d)
  if curl -sf "http://$MYRESUME_HOST/resume.yaml" > "$tmp_dir/resume.yaml" \
     && rendercv render "$tmp_dir/resume.yaml" -o "$tmp_dir/out" -nopng; then
    cp "$tmp_dir"/out/*.pdf /pandoc/resume.pdf
    cp "$tmp_dir"/out/*.html /pandoc/resume.html
  else
    echo "$(date -u) -- render failed, keeping previous files"
  fi
  rm -rf "$tmp_dir"
  sleep 30
done
