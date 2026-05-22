# Mejora Módulo Crear Licitación - Dashboard Inteligente + Mercado Público

## Objetivo

Transformar el módulo actual de creación de licitaciones en una herramienta de apoyo a decisiones, permitiendo:

- Revisar licitaciones históricas y vigentes
- Visualizar consumo presupuestario
- Detectar licitaciones similares
- Evitar duplicidad de compras
- Revisar órdenes de compra asociadas
- Analizar comportamiento anual
- Integrar información desde Mercado Público
- Mejorar la toma de decisiones antes de crear una nueva licitación

---

# Estructura General

El módulo debe dividirse en 3 áreas:

1. Dashboard previo a crear licitación
2. Formulario de creación
3. Panel inteligente de análisis y Mercado Público

---

# 1. Dashboard previo a crear licitación

## Objetivo

Mostrar información resumida y estratégica antes de crear una licitación.

---

## Cards Superiores (Resumen Ejecutivo)

Mostrar 4 cards superiores.

### Card 1 - Licitaciones activas

Información:

- Cantidad de licitaciones activas
- Licitaciones próximas a vencer

Ejemplo:

- 18 licitaciones activas
- 4 próximas a vencer

---

### Card 2 - Presupuesto comprometido

Información:

- Presupuesto total anual
- Monto comprometido
- Saldo disponible

Ejemplo:

- Total: $450.000.000
- Utilizado: $310.000.000
- Disponible: $140.000.000

---

### Card 3 - Consumo anual

Información:

- % ejecución presupuestaria anual

Fórmula:

```math
Consumo = (Monto utilizado / Monto adjudicado) * 100
```
