# Deployment Runbook

## Voraussetzungen
- VPS mit Docker und Docker Compose
- Domain mit A-Record auf VPS-IP

## Erstmalige Einrichtung

```bash
# Auf dem VPS
git clone <repo-url> /opt/platzwart
cd /opt/platzwart
cp .env.example .env
# .env bearbeiten: DB_PASSWORD und DOMAIN setzen
docker compose -f docker-compose.prod.yml up -d --build
```

## Update

```bash
cd /opt/platzwart
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Backup

```bash
# Manuell
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U platzwart platzwart > backup_$(date +%Y%m%d).sql

# Automatisch (Crontab)
0 3 * * * cd /opt/platzwart && docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U platzwart platzwart | gzip > /opt/backups/platzwart_$(date +\%Y\%m\%d).sql.gz
```

## Logs

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f caddy
```
