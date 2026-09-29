---
inclusion: always
---

# Sistema de Diseño y Paleta de Colores (Atlas Gym Theme Oficial)

Esta regla define los estándares visuales oficiales para `GymTrainingPlan`, basados estrictamente en la identidad visual de Atlas Gym: **Negro Puro (`#000000`), Blanco (`#FFFFFF`) y Rojo Carmesí Puro (`#EF1818` / `#E40014`)**. No se utiliza naranja.

---

## 1. Tokens de Diseño y Variables CSS (`:root`)

```css
:root {
  /* ⬛ Fondos (Dark Mode Profundo) */
  --bg-main: #000000;
  --bg-surface: #0e1217;
  --bg-surface-elevated: #161b22;
  --bg-surface-card: rgba(14, 18, 23, 0.9);
  --bg-glass: rgba(14, 18, 23, 0.7);

  /* 🔴 Acentos de Marca (Rojo Carmesí Puro Atlas) */
  --primary: #ef1818;
  --primary-hover: #dc2626;
  --primary-vibrant: #fb2c36;
  --primary-deep: #460809;
  --primary-glow: rgba(239, 24, 24, 0.25);
  --primary-glow-strong: rgba(239, 24, 24, 0.45);

  /* ⚪ Tipografía y Textos */
  --text-main: #ffffff;
  --text-muted: #9ca3af;
  --text-dimmed: #6b7280;
  --text-accent: #ef1818;

  /* 🪟 Bordes */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-white-faint: rgba(255, 255, 255, 0.04);
  --border-accent: rgba(239, 24, 24, 0.35);
  --border-accent-hover: rgba(251, 44, 54, 0.7);

  /* ✨ Sombras con Resplandor Rojo */
  --shadow-glow: 0 0 30px rgba(239, 24, 24, 0.25);
  --shadow-glow-lg: 0 0 50px rgba(239, 24, 24, 0.4);
  --shadow-card: 0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7);
}
```

---

## 2. Pautas Visuales
* **Botones**: Color rojo sólido `#EF1818` o gradiente sutil de rojo a rojo intenso `linear-gradient(135deg, #EF1818 0%, #B91C1C 100%)`.
* **Títulos con Acento**: Texto en rojo puro `#EF1818` o gradiente blanco a rojo `linear-gradient(135deg, #FFFFFF 20%, #EF1818 100%)`.
* **Prohibido**: No usar tonos naranjas, amarillos o cobrizos.
