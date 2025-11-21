#!/bin/sh

cat <<EOF > /usr/share/caddy/env.js
window.APP_CONFIG = {
  BRENNAN_URL: "${BRENNAN_URL}",
}
EOF

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
