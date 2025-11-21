FROM caddy:2-alpine

COPY site /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
