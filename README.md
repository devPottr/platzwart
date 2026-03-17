# Platzwart - Sportplatz-Buchungssystem

Webanwendung zur Verwaltung und Buchung von Sportplaetzen fuer lokale Sportvereine.

## Features

- Buchung von Sportplaetzen mit konfigurierbarem Grid (Teilbelegungen moeglich)
- Wochenansicht mit Kalender und visueller Platzdarstellung
- Serien-Buchungen (woechentlich, 2-woechentlich)
- Rollen-basierte Zugriffskontrolle (Admin, Platzwart, Trainer, Mitglied)
- Team-Verwaltung mit Farbzuordnung
- Konflikterkennung bei Buchungen
- Dark/Light Theme

## Tech-Stack

- **Backend**: ASP.NET Core Minimal APIs (.NET 10)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **State**: Zustand
- **DB**: PostgreSQL 17 + Entity Framework Core
- **Auth**: Session-basiert (HttpOnly Cookies, bcrypt)
- **Deploy**: Docker Compose + Caddy (Auto-HTTPS)

## Schnellstart

### Voraussetzungen

- [.NET 10 SDK](https://dot.net)
- [Node.js 22+](https://nodejs.org)
- [Docker](https://docker.com)

### Entwicklung

```bash
# PostgreSQL starten
docker compose up -d

# Backend starten
cd backend/src/Platzwart
dotnet run

# Frontend starten (separates Terminal)
cd frontend
npm install
npm run dev
```

Oeffne http://localhost:5173 im Browser.

**Standard-Admin-Account**: admin@platzwart.local / admin123!

### Produktion

```bash
cp .env.example .env
# .env bearbeiten: DB_PASSWORD und DOMAIN setzen
docker compose -f docker-compose.prod.yml up -d --build
```

## Tests

```bash
dotnet test backend/tests/Platzwart.Tests
```

## Projektstruktur

```
platzwart/
├── backend/
│   ├── src/Platzwart/          # ASP.NET Core API
│   │   ├── Auth/               # Session, Middleware, Endpoints
│   │   ├── Bookings/           # Buchungs-Domain
│   │   ├── Data/               # DbContext + Migrations
│   │   ├── Fields/             # Platz-Domain
│   │   ├── Middleware/         # Security, CSRF, Rate Limit
│   │   ├── Teams/              # Team-Domain
│   │   └── Users/              # Benutzer-Domain
│   └── tests/Platzwart.Tests/
├── frontend/
│   └── src/
│       ├── api/                # API-Client
│       ├── components/         # React-Komponenten
│       ├── pages/              # Seiten
│       ├── stores/             # Zustand Stores
│       ├── types/              # TypeScript-Typen
│       └── utils/              # Hilfsfunktionen
├── docs/                       # Architektur, ADRs, Runbooks
├── Dockerfile                  # Multi-stage Build
├── docker-compose.yml          # Dev (PostgreSQL)
└── docker-compose.prod.yml     # Prod (Caddy + App + PostgreSQL)
```

## Rollen

| Rolle | Rechte |
|---|---|
| Admin | Alles + Benutzerverwaltung + Plaetze anlegen |
| Platzwart | Teams verwalten + Buchungen anderer bearbeiten/loeschen + Wartung/Sperrung |
| Trainer | Eigene Buchungen erstellen/bearbeiten/loeschen |
| Mitglied | Nur lesen |

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/auth/login` | Anmeldung |
| POST | `/api/auth/register` | Registrierung |
| GET | `/api/auth/me` | Aktueller Benutzer |
| GET | `/api/fields` | Alle Plaetze |
| GET | `/api/teams` | Alle Teams |
| GET | `/api/bookings?fieldId=&weekStart=` | Buchungen pro Platz/Woche |
| POST | `/api/bookings` | Neue Buchung |

## Lizenz

MIT - siehe [LICENSE](LICENSE)
