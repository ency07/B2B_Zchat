# Reporte de Implementación: FASE 7 - Inventarios (Bodegas, Artículos y Movimientos)

Este reporte detalla las tablas, funciones, triggers, políticas RLS y resultados de las pruebas de verificación para la **FASE 7 (Inventario)**, incorporando las respuestas oficiales aprobadas por el negocio.

---

## 1. Estructuras Creadas

### 1.1 Tablas Creadas
1.  **`warehouses`:** Catálogo de bodegas vinculadas a sedes.
2.  **`inventory_items`:** Catálogo global por tenant de artículos de inventario, con soporte para stock mínimo (`minimum_stock`), stock crítico/punto de reorden (`reorder_point`), costo promedio ponderado (`average_cost`) y último costo (`last_cost`).
3.  **`inventory_stock`:** Representación física y reservada del stock por bodega y artículo.
4.  **`inventory_movements`:** Historial inmutable y auditable de transacciones de inventario (Entrada, Salida, Reserva, Transferencia, Ajuste).

### 1.2 Funciones y Triggers PL/pgSQL
1.  **`handle_inventory_sequences()`:** Trigger `BEFORE INSERT` que asigna códigos secuenciales por tenant (`WH-000001`, `ART-000001`, `MOV-000001`).
2.  **`enforce_inventory_permissions()`:** Trigger de seguridad RBAC que restringe las operaciones de catálogo y movimientos según el rol del usuario (por ejemplo, creación de artículos y bodegas reservada a `JEFE_INVENTARIO`, `GERENTE`; registro a `ALMACENISTA`).
3.  **`validate_inventory_movement_transitions()`:** Valida e impide modificar el estado de un movimiento de inventario si ya se encuentra en un estado final (`Aplicado`, `Anulado`). Un movimiento `'Aplicado'` no puede anularse.
4.  **`update_item_costs()`:** Recalcula automáticamente el costo promedio ponderado (`average_cost`) y el costo de la última entrada (`last_cost`) al aplicar un movimiento de tipo `'Entrada'`.
5.  **`check_and_dispatch_low_stock_events()`:** Evalúa el stock disponible del artículo por tenant y despacha eventos `INVENTORY_STOCK_LOW` o `INVENTORY_STOCK_CRITICAL` si cae por debajo de sus respectivos límites.
6.  **`dispatch_material_consumed_event()`:** Registra el evento de negocio `JOB_MATERIAL_CONSUMED` para consumos asociados a OTs (`job_id`).
7.  **`handle_inventory_stock_affectation()`:** Trigger de núcleo que:
    *   Autocompleta el costo de salida con el costo promedio.
    *   Suma/resta stock físico y reservado al pasar el movimiento a `'Aplicado'`.
    *   Procesa de forma atómica transferencias entre bodegas.
    *   Valida no stock negativo (`available_quantity >= 0`).
8.  **`block_physical_inventory_delete()`:** Trigger que bloquea sentencias `DELETE` físicas directas sobre los registros de inventario.

---

## 2. Decisiones de Negocio Implementadas

*   **No Stock Negativo:** Cualquier movimiento que intente reducir el stock disponible o físico por debajo de 0 es abortado mediante excepciones a nivel de base de datos.
*   **Transferencia Directa:** Un movimiento `'Transferencia'` disminuye la bodega origen e incrementa la bodega destino de forma atómica en la misma transacción transaccional.
*   **Trazabilidad 100% en Jobs:** Cada Salida de inventario destinada a un trabajo requiere `job_id` de forma obligatoria y opcionalmente `activity_id`, registrando quién consumió, qué consumió, cuánto costó y cuándo se retiró.
*   **Roles y Permisos:**
    *   `ALMACENISTA`: Registra movimientos y consulta existencias.
    *   `JEFE_INVENTARIO`: Aprobación y aplicación de movimientos, creación de bodegas, artículos, ajustes y transferencias.
    *   `GERENTE`: Control total.
*   **Soft Delete y Auditoría:** Todas las tablas cuentan con soft delete y triggers asociados a `audit_log` y `business_events`.

---

## 3. Políticas RLS
Row Level Security (RLS) habilitado en las 4 tablas con aislamiento multiempresa por `tenant_id` en lecturas y escrituras, protegiendo los datos frente a accesos indebidos de otros tenants.

---

## 4. Reporte de Pruebas Ejecutadas

Se ejecutó la validación estática local para verificar la integridad sintáctica y de diseño del script de migración:
```bash
npm run test:inventory
```
**Resultado:** ÉXITO. Se validó la existencia de las tablas de bodegas, artículos, existencias y movimientos, campos críticos para punto de reorden y transferencias, triggers de secuencias y RLS, y funciones auxiliares de costos y eventos.
