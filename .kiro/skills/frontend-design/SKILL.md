---
name: frontend-design
description: Generación de interfaces frontend modernas, expresivas y accesibles. Evita el aspecto genérico de IA, prioriza jerarquía visual, contrastes adecuados, micro-interacciones y accesibilidad WCAG. Usar al maquetar componentes, páginas o flujos de usuario.
---

# Reglas de Diseño Frontend y Experiencia de Usuario

## 1. Jerarquía Visual y Tipografía
- Evita el aspecto plano usando pesos tipográficos variados (font-medium, font-bold).
- Asegura una escala modular con contraste mínimo 4.5:1.

## 2. Espaciado y Composición
- Todo padding, margin y gap debe basarse en múltiplos de 4px / 8px.
- Bordes sutiles (border border-neutral-200 dark:border-neutral-800) y sombras ligeras.

## 3. Estados y Micro-interacciones
- Todo botón e input debe incluir hover, active y focus-visible:ring-2.
- Incluir siempre skeletons para carga y empty states con CTA.

## 4. Semántica
- Usar etiquetas nativas (<button>, <nav>, <main>) y aria-labels donde corresponda.
