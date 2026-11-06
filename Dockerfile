FROM python:3.13-slim

RUN apt-get update && apt-get install -y --no-install-recommends pandoc curl \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir "rendercv[full]>=2.8"

ADD . /app/
WORKDIR /app
RUN pip install --no-cache-dir .

RUN mkdir -p /resume /pandoc \
    && cp resume.json resume.md.jinja2 /resume/ \
    && groupadd -g 15000 resume && useradd -u 15000 -g resume -m resume \
    && chown 15000:15000 /pandoc
USER resume

EXPOSE 5001
ENTRYPOINT ["/app/entrypoint.sh"]
