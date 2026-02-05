FROM nginx:1.29-alpine

RUN rm -f /etc/nginx/conf.d/default.conf && cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  include /etc/nginx/mime.types;
  types { application/x-shockwave-flash swf; }

  location / {
    try_files $uri $uri/ =404;
  }

  location /assets/ {
    add_header Cache-Control "public, max-age=3600";
    try_files $uri =404;
  }
}
EOF

COPY index.html /usr/share/nginx/html/index.html
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80
