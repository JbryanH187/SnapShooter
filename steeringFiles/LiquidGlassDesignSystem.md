# 🔮 LIQUID GLASS DESIGN SYSTEM - Guía de Implementación

> **Inspirado en**: iOS 26 / macOS Tahoe / Apple Vision Pro  
> **Filosofía**: Materiales dinámicos, tokens semánticos, física real

---

## 🎨 Variables CSS Globales

Agregar en tu archivo CSS principal (e.g., `index.css`):

```css
/* ===============================================
   LIQUID GLASS - CSS VARIABLES
   =============================================== */

:root {
  /* ─────────────────────────────────────────────
     SYSTEM BACKGROUNDS (Light Mode Default)
     ───────────────────────────────────────────── */
  --system-background: #ffffff;
  --system-background-secondary: #f2f2f7;
  --system-background-tertiary: #ffffff;
  --system-background-grouped: #f2f2f7;

  /* ─────────────────────────────────────────────
     LABELS (Texto)
     ───────────────────────────────────────────── */
  --label-primary: #000000;
  --label-secondary: rgba(60, 60, 67, 0.6);
  --label-tertiary: rgba(60, 60, 67, 0.3);
  --label-quaternary: rgba(60, 60, 67, 0.18);

  /* ─────────────────────────────────────────────
     FILLS (Backgrounds de elementos UI)
     ───────────────────────────────────────────── */
  --fill-primary: rgba(120, 120, 128, 0.2);
  --fill-secondary: rgba(120, 120, 128, 0.16);
  --fill-tertiary: rgba(118, 118, 128, 0.12);
  --fill-quaternary: rgba(116, 116, 128, 0.08);

  /* ─────────────────────────────────────────────
     SEMANTIC COLORS (iOS System Colors)
     ───────────────────────────────────────────── */
  --system-blue: #007aff;
  --system-green: #34c759;
  --system-orange: #ff9500;
  --system-red: #ff3b30;
  --system-yellow: #ffcc00;
  --system-purple: #af52de;
  --system-pink: #ff2d55;
  --system-teal: #5ac8fa;

  /* ─────────────────────────────────────────────
     SEPARATORS (Bordes y divisores)
     ───────────────────────────────────────────── */
  --separator-opaque: #c6c6c8;
  --separator-non-opaque: rgba(60, 60, 67, 0.29);

  /* ─────────────────────────────────────────────
     GEOMETRY (Squircle radii)
     ───────────────────────────────────────────── */
  --radius-base: 10px;
  --radius-card: 12px;
  --radius-modal: 20px;
  --radius-sheet: 28px;

  /* ─────────────────────────────────────────────
     PHYSICS (Animation timing)
     ───────────────────────────────────────────── */
  --timing-fast: 150ms;
  --timing-normal: 300ms;
  --timing-slow: 500ms;

  /* ─────────────────────────────────────────────
     MATERIAL (Glass properties)
     ───────────────────────────────────────────── */
  --material-saturation: 1.2;
  --material-blur-thin: 20px;
  --material-blur-regular: 30px;
  --material-blur-thick: 50px;
}

/* ===============================================
   DARK MODE
   =============================================== */
.dark {
  --system-background: #000000;
  --system-background-secondary: #1c1c1e;
  --system-background-tertiary: #2c2c2e;
  --system-background-grouped: #000000;

  --label-primary: #ffffff;
  --label-secondary: rgba(235, 235, 245, 0.6);
  --label-tertiary: rgba(235, 235, 245, 0.3);
  --label-quaternary: rgba(235, 235, 245, 0.18);

  --fill-primary: rgba(120, 120, 128, 0.36);
  --fill-secondary: rgba(120, 120, 128, 0.32);
  --fill-tertiary: rgba(118, 118, 128, 0.24);
  --fill-quaternary: rgba(116, 116, 128, 0.18);

  --system-blue: #0a84ff;
  --system-green: #30d158;
  --system-orange: #ff9f0a;
  --system-red: #ff453a;
  --system-yellow: #ffd60a;
  --system-purple: #bf5af2;
  --system-pink: #ff375f;
  --system-teal: #64d2ff;

  --separator-opaque: #38383a;
  --separator-non-opaque: rgba(84, 84, 88, 0.65);
}
```

---

## 🥛 Componente LiquidGlass

El corazón del sistema. Un wrapper que aplica glassmorphism dinámico:

```tsx
// LiquidGlass.tsx
import React from 'react';

type MaterialType = 'ultraThin' | 'thin' | 'regular' | 'thick' | 'ultraThick';

interface LiquidGlassProps {
  children: React.ReactNode;
  material?: MaterialType;
  className?: string;
  tint?: string;
  style?: React.CSSProperties;
}

const blurIntensity: Record<MaterialType, number> = {
  ultraThin: 10,
  thin: 20,
  regular: 30,
  thick: 50,
  ultraThick: 80,
};

const backgroundOpacity: Record<MaterialType, number> = {
  ultraThin: 0.5,
  thin: 0.6,
  regular: 0.7,
  thick: 0.8,
  ultraThick: 0.9,
};

export const LiquidGlass: React.FC<LiquidGlassProps> = ({
  children,
  material = 'regular',
  className = '',
  tint,
  style = {},
}) => {
  const blur = blurIntensity[material];
  const opacity = backgroundOpacity[material];

  const glassStyle: React.CSSProperties = {
    backdropFilter: `blur(${blur}px) saturate(var(--material-saturation, 1.2))`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(var(--material-saturation, 1.2))`,
    backgroundColor: tint
      ? `${tint}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
      : `color-mix(in srgb, var(--system-background) ${Math.round(opacity * 100)}%, transparent)`,
    border: '1px solid var(--separator-non-opaque)',
    ...style,
  };

  return (
    <div className={`liquid-glass ${className}`} style={glassStyle}>
      {children}
    </div>
  );
};
```

### Uso:

```tsx
<LiquidGlass material="thick">
  <h2>Contenido con glass</h2>
</LiquidGlass>

<LiquidGlass material="thin" tint="#007aff">
  <p>Glass con tinte azul</p>
</LiquidGlass>
```

---

## 🎭 Tipografía

```css
/* Font Stack */
--font-primary: 'Inter', 'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Escala Tipográfica */
.text-xs   { font-size: 11px; }
.text-sm   { font-size: 13px; }
.text-base { font-size: 15px; }
.text-lg   { font-size: 17px; }
.text-xl   { font-size: 20px; }
.text-2xl  { font-size: 24px; }
.text-3xl  { font-size: 30px; }
```

---

## ⚡ Animaciones con Framer Motion

### Spring Physics (recomendado):

```tsx
import { motion } from 'framer-motion';

// Transición bouncy suave
const springTransition = {
  type: 'spring',
  damping: 25,
  stiffness: 300,
};

// Hover scale
<motion.div
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={springTransition}
>
  Contenido
</motion.div>

// Pulse animation (para empty states)
<motion.div
  animate={{ scale: [1, 1.02, 1] }}
  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
>
  <Icon />
</motion.div>
```

### Fade In/Out:

```tsx
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      Contenido
    </motion.div>
  )}
</AnimatePresence>
```

---

## 🎨 Patrones de Color Dinámicos

### Color-mix para acentos:

```css
/* Background tintado */
background: color-mix(in srgb, var(--system-blue) 15%, transparent);

/* Border con opacidad */
border: 1px solid color-mix(in srgb, var(--system-blue) 30%, transparent);

/* Hover state */
background: color-mix(in srgb, var(--system-blue) 10%, var(--fill-secondary));
```

### Glowing Effect:

```tsx
{/* Glow Container */}
<div className="relative">
  {/* Glow (behind) */}
  <div
    className="absolute inset-0 rounded-full blur-2xl opacity-30"
    style={{ background: 'var(--system-blue)', transform: 'scale(1.2)' }}
  />
  {/* Icon (front) */}
  <Icon size={80} style={{ color: 'var(--system-blue)' }} />
</div>
```

---

## 🔘 Componentes Comunes

### Botón Primario:

```tsx
<button
  className="px-4 py-3 rounded-xl font-medium text-white transition-all"
  style={{
    background: 'var(--system-blue)',
    boxShadow: '0 4px 12px color-mix(in srgb, var(--system-blue) 40%, transparent)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
>
  Acción Principal
</button>
```

### Keyboard Shortcut Pill:

```tsx
<div
  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl"
  style={{
    background: 'color-mix(in srgb, var(--system-blue) 10%, var(--fill-secondary))',
    border: '1px solid color-mix(in srgb, var(--system-blue) 20%, transparent)',
  }}
>
  <span style={{ color: 'var(--label-secondary)' }}>Presiona</span>
  <kbd
    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
    style={{
      color: 'var(--system-blue)',
      background: 'color-mix(in srgb, var(--system-blue) 15%, transparent)',
      border: '1px solid color-mix(in srgb, var(--system-blue) 30%, transparent)',
    }}
  >
    Ctrl+K
  </kbd>
</div>
```

### Modal con LiquidGlass:

```tsx
{/* Backdrop */}
<div
  className="fixed inset-0 z-40"
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(20px)',
  }}
  onClick={onClose}
/>

{/* Modal */}
<LiquidGlass
  material="thick"
  className="relative w-full max-w-md"
  style={{
    borderRadius: 'var(--radius-modal)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.2)',
  }}
>
  {/* Content */}
</LiquidGlass>
```

---

## ✅ Checklist de Implementación

```markdown
[ ] Agregar CSS variables a index.css
[ ] Crear componente LiquidGlass
[ ] Configurar ThemeContext para toggle light/dark
[ ] Aplicar clase 'dark' a document.documentElement
[ ] Reemplazar colores hardcodeados con CSS vars
[ ] Usar color-mix() para acentos dinámicos
[ ] Agregar animaciones Framer Motion a elementos interactivos
```

---

## 📚 Referencias

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [CSS color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- [Framer Motion](https://www.framer.com/motion/)
