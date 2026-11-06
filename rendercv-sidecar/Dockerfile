FROM python:3.13-slim

ENV MYRESUME_HOST="resume1:5001"

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir "rendercv[full]>=2.8"
COPY ./entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

RUN groupadd -g 15000 resume && useradd -u 15000 -g resume -m resume
RUN mkdir -p /pandoc && chmod 755 /pandoc/ && chown 15000:15000 /pandoc
USER resume

ENTRYPOINT ["/entrypoint.sh"]
