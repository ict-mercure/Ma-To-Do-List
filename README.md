# To-Do List (static)

Une petite application To-Do écrite en HTML/CSS/JS. Elle stocke les tâches dans `localStorage`.

Ouvrir localement

1. Ouvrez `01-index.html` dans votre navigateur (double-clic ou `open 01-index.html` sur macOS).

Fonctionnalités

- Ajouter, éditer (double-clic ou focus), supprimer des tâches
- Marquer comme terminé
- Filtrer: Tous / Actifs / Terminés
- Persistance via `localStorage`

Contextes

L'application propose 3 contextes (Contexte 1 / Contexte 2 / Contexte 3). Choisis un contexte, et tu verras uniquement les tâches associées à ce contexte. Les contextes sont persistés entre les rechargements.

Notes

- C'est un site statique, pas besoin de serveur. Pour développement rapide, vous pouvez lancer un simple serveur si vous préférez:

```bash
# Python 3
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```
