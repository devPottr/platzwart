# ADR-001: Minimal APIs statt Controller

## Status
Akzeptiert

## Kontext
Fuer das Backend stehen ASP.NET Core Controller oder Minimal APIs zur Verfuegung.

## Entscheidung
Minimal APIs, da:
- Weniger Boilerplate
- Einfachere Struktur fuer ein kleines Projekt
- Feature-Ordner passen besser als Controller-Ordner
- Performance-Vorteil (kein MVC-Overhead)

## Konsequenzen
- Endpoint-Registrierung in Extension Methods pro Feature
- Kein Model Binding via Attribute (stattdessen Parameter-Injection)
- Filter statt ActionFilter fuer Auth
