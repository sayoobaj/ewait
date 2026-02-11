#!/bin/bash
# eWait VPS Deployment Script
# Run on DigitalOcean Ubuntu VPS

set -e

echo "🚀 Deploying eWait..."

# 1. Update system
apt update && apt upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Install PostgreSQL
apt install -y postgresql postgresql-contrib

# 4. Install Nginx & Certbot
apt install -y nginx certbot python3-certbot-nginx

# 5. Install PM2
npm install -g pm2

# 6. Create PostgreSQL database
sudo -u postgres psql << EOF
CREATE USER ewait WITH PASSWORD 'ewait_secure_password_2026';
CREATE DATABASE ewait_db OWNER ewait;
GRANT ALL PRIVILEGES ON DATABASE ewait_db TO ewait;
EOF

echo "✅ PostgreSQL database created"

# 7. Clone repo
mkdir -p /var/www
cd /var/www
git clone https://github.com/sayoobaj/ewait.git
cd ewait

# 8. Create .env
cat > .env << EOF
DATABASE_URL="postgresql://ewait:ewait_secure_password_2026@localhost:5432/ewait_db?schema=public"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://YOUR_DOMAIN_OR_IP"
NEXT_PUBLIC_APP_URL="http://YOUR_DOMAIN_OR_IP"

# Add your API keys
PAYSTACK_SECRET_KEY=""
PAYSTACK_PUBLIC_KEY=""
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=""
TERMII_API_KEY=""
TERMII_SENDER_ID="eWait"
EOF

echo "⚠️  Edit /var/www/ewait/.env with your domain and API keys!"

# 9. Install dependencies & build
npm install
npx prisma generate
npx prisma db push
npm run build

# 10. Start with PM2
pm2 start npm --name "ewait" -- start
pm2 save
pm2 startup

echo "✅ eWait running on port 3000"

# 11. Configure Nginx
cat > /etc/nginx/sites-available/ewait << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/ewait /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ Nginx configured"
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Edit /var/www/ewait/.env (add domain & API keys)"
echo "2. Run: pm2 restart ewait"
echo "3. For SSL: certbot --nginx -d yourdomain.com"
