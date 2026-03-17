# Architektur

## Ueberblick

```
Browser <-> Caddy (HTTPS) <-> ASP.NET Core (API + Static Files) <-> PostgreSQL
```

## Backend-Struktur
Feature-basierte Organisation: Jedes Feature (Auth, Users, Teams, Fields, Bookings) hat eigene Endpoints, Services und Entities im gleichen Ordner.

## Frontend-Struktur
React SPA mit Zustand fuer State Management. Wird von Vite gebaut und als statische Dateien vom ASP.NET Core Server ausgeliefert.

## Datenfluss
1. User interagiert mit React UI
2. API-Call an Backend (Session-Cookie wird automatisch mitgesendet)
3. SessionMiddleware laedt User aus DB
4. Endpoint prueft Berechtigung
5. Service fuehrt Business-Logik aus
6. EF Core speichert in PostgreSQL
7. Response zurueck an UI
