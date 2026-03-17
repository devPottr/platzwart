# ADR-002: Session-Auth statt JWT

## Status
Akzeptiert

## Kontext
Authentifizierung kann ueber JWT oder Server-seitige Sessions erfolgen.

## Entscheidung
Session-basierte Auth mit HttpOnly Cookies, weil:
- Einfacher zu implementieren und zu verstehen
- HttpOnly Cookies schuetzen vor XSS-Token-Diebstahl
- Server-seitige Session-Verwaltung erlaubt sofortiges Invalidieren
- Kein Token-Refresh-Mechanismus noetig
- Fuer eine Single-Server-Anwendung ideal

## Konsequenzen
- Session-Tabelle in DB noetig
- Session-Cleanup als Hintergrundaufgabe
- CSRF-Schutz erforderlich (Double-Submit-Cookie)
