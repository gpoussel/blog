# Design

Système visuel du blog. Référence pour garder toute évolution cohérente et sur-marque.

## Mood

Un carnet de réflexion lu tard le soir : bleu ardoise profond, lumière calme, une touche de
mauve poudré gardée en marge. Posé, lucide, intime sans bavardage. La page respire ; le texte
domine ; le décor se ressent plus qu'il ne se voit.

## Color

Palette de base : `#213C51` ardoise · `#6594B1` bleu acier · `#DDAED3` mauve poudré ·
`#EEEEEE` gris clair. Stratégie : **restrained** (neutres froids + ardoise primaire qui porte
l'identité, mauve en accent ≤ 10 % pour la signature). OKLCH partout, deux thèmes pensés
ensemble. Le texte courant est légèrement assombri par rapport aux teintes pures (acier et
mauve trop pâles pour du corps de texte) afin de tenir le contraste AA.

### Thème clair (défaut diurne)

| Rôle    | OKLCH                      | Source / Usage                                   |
|---------|----------------------------|--------------------------------------------------|
| bg      | `oklch(0.99 0.004 240)`    | Blanc à peine froid.                             |
| surface | `oklch(0.949 0.006 240)`   | `#EEEEEE` — cartes, header, code.                |
| ink     | `oklch(0.3 0.05 244)`      | Ardoise assombrie. ~10:1 sur bg.                 |
| muted   | `oklch(0.5 0.045 240)`     | Acier assombri. ~4.7:1 sur bg.                   |
| primary | `oklch(0.345 0.05 243)`    | `#213C51` — liens, titres, marque. ~9:1 sur bg.  |
| accent  | `oklch(0.805 0.073 334)`   | `#DDAED3` — pills, soulignés, courbes fortes.    |
| on-accent | `oklch(0.3 0.05 244)`    | Texte ardoise sur le mauve (fond pâle).          |
| border  | `oklch(0.88 0.006 240)`    | Filets, séparateurs.                             |

### Thème sombre

| Rôle    | OKLCH                      | Source / Usage                                   |
|---------|----------------------------|--------------------------------------------------|
| bg      | `oklch(0.205 0.028 244)`   | Ardoise très profonde (pas un gris neutre).      |
| surface | `oklch(0.265 0.04 244)`    | Cartes, encarts (proche `#213C51`).              |
| ink     | `oklch(0.93 0.006 240)`    | `#EEEEEE` — texte courant.                       |
| muted   | `oklch(0.71 0.055 237)`    | Acier clair. ≥ 5:1 sur bg.                       |
| primary | `oklch(0.74 0.07 235)`     | `#6594B1` éclairci — liens, marque.              |
| accent  | `oklch(0.805 0.075 334)`   | `#DDAED3` — pills, soulignés.                    |
| on-accent | `oklch(0.22 0.03 245)`   | Texte ardoise sur le mauve.                      |
| border  | `oklch(0.4 0.035 244)`     | Filets, séparateurs.                             |

Règle texte-sur-couleur : le mauve est un fond **pâle**, donc texte **ardoise foncé** dessus
(pills, badges). Les puces de liste et le filet de citation utilisent la primaire (l'ardoise),
plus lisible que le mauve sur fond clair.

## Typography

Trois familles, axe de contraste serif/sans. Variables, self-hosted via `@fontsource`.

- **Corps (lecture)** : **Literata** (serif de lecture variable, italique vraie ; conçue
  pour le livre numérique, chaleureuse et légèrement calligraphique). Articles, prose.
  `font-size` base 1.125rem, `line-height` 1.7, mesure 66–72ch.
- **Titres / UI** : **Hanken Grotesk** (sans humaniste, chaleureuse). h1–h3, nav, méta,
  boutons. Contraste de graisse fort (400 ↔ 700).
- **Mono (code)** : **Victor Mono** (variable, ligatures de programmation et italique
  cursive caractéristique). Blocs et inline code (blog tech). NB : la cursive n'apparaît que
  sur du texte en italique ; le code des articles ne l'étant pas par défaut, elle reste un
  détail latent (activable en italisant les commentaires si souhaité).

Échelle (ratio ~1.25), `clamp()` fluide. Plafond h1 ≈ 3.5rem (on ne crie pas).
`text-wrap: balance` sur h1–h3, `pretty` sur la prose. Pas de capitales en corps.

## Motion

Discrète, au service de la lecture. `ease-out` exponentiel (quart/expo), jamais de rebond.

- Entrée de page : révélation décalée (stagger) des cartes/titres via `animation-delay`,
  sur un état déjà visible (jamais de contenu masqué tant qu'une classe ne se déclenche pas).
- Hover cartes : élévation douce + glissement du filet d'accent.
- Bascule de thème : crossfade des couleurs (`transition` sur les variables).
- `@media (prefers-reduced-motion: reduce)` : tout devient fondu instantané ou rien.

## Background — Courbes topographiques

Motif signature : lignes de niveau fines, concentriques, type carte. SVG léger en `position:
fixed`, très basse opacité (clair ~0.04–0.06 en primary ; sombre ~0.05–0.08). Purement
décoratif (`aria-hidden`, masqué aux lecteurs d'écran). Densité variable pour éviter la
répétition mécanique ; jamais en concurrence avec le texte. Désactivé sous reduced-motion si
animé.

## Layout & Components

- Largeur de contenu : ~68ch pour la prose, ~72rem pour les grilles d'accueil.
- **Header** : minimal, sticky léger, logo/nom + nav (Accueil, À propos) + ThemeToggle.
- **PostCard** : image de couverture (banque d'images), catégorie (pill accent), titre serif?
  non — titre sans, extrait serif, date + temps de lecture en muted. Pas de grille de cartes
  identiques : l'article le plus récent peut être mis en avant (carte large).
- **Footer** : sobre, une ligne — © + liens LinkedIn / GitHub.
- **Article** : image de couverture pleine largeur contenue, titre, méta, prose Markdown
  stylée (titres, citations à filet, code, listes, liens primary souligné fin).
- Pas de stripe latérale colorée, pas de texte en gradient, pas de glassmorphism par défaut,
  pas d'eyebrow en capitales sur chaque section.

## Accessibility

WCAG 2.1 AA. Focus visibles (anneau primary). Navigation clavier complète. Contraste vérifié
sur les deux thèmes. Préférence système respectée (`prefers-color-scheme`) + bascule persistée
(localStorage), sans flash au chargement.
