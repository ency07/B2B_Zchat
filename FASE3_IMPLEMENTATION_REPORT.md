# Reporte de Implementación: FASE 3 - Requerimientos y Repositorio Documental

Este reporte detalla las tablas, funciones, triggers, políticas RLS y resultados de las pruebas de verificación para la **FASE 3 (Requerimientos)** y **FASE 7 (Repositorio Documental Transversal)**, de acuerdo con el diseño aprobado.

---

## 1. Estructuras Creadas

### 1.1 Tablas Creadas
1.  **`tenant_sequences`:** Tabla centralizada para control de concurrencia e incremento de códigos de negocio aislados por tenant, evitando el uso no escalable de `MAX(code)+1`.
2.  **`requirements`:** Tabla principal de requerimientos de clientes, con soporte para responsables de ingeniería y comerciales dedicados, y control de SLAs en horas hábiles.
3.  **`documents`:** Repositorio transversal polimórfico de documentos del ERP (Fase 7), utilizado por Requerimientos para verificar PDF de diagnósticos y cotizaciones.

### 1.2 Funciones Creadas (PL/pgSQL)
1.  **`get_current_user_id()`:** Obtiene el `user_id` operativo del usuario autenticado cruzándolo con `auth.uid()`.
2.  **`add_business_hours(p_start, p_hours)`:** Suma horas hábiles omitiendo sábados y domingos para el cálculo exacto de SLAs.
3.  **`get_next_tenant_sequence(p_tenant_id, p_sequence_type)`:** Retorna el secuencial incrementado bloqueando la fila del tenant para evitar duplicados en entornos concurrentes.
4.  **`handle_requirement_code()` / `handle_document_code()`:** Triggers para autogenerar códigos (`REQ-XXXXXX`, `DOC-XXXXXX`) de manera inmutable.
5.  **`handle_document_versioning()`:** Trigger para versionado documental. Incrementa la versión y marca las versiones anteriores automáticamente como `OBSOLETO`.
6.  **`handle_requirement_traceability()`:** Calcula y almacena físicamente las fechas límite de SLA (`sla_response_due_at`, `sla_diagnostic_due_at`, `sla_quote_due_at`, `sla_close_due_at`) e inyecta responsables en reasignaciones.
7.  **`validate_requirement_state_transitions()`:** Valida el flujo lineal de estados, la obligatoriedad de adjuntos PDF (DIAGNOSTIC y QUOTE), y la matriz de cancelación estructurada.
8.  **`enforce_requirement_permissions()` / `current_user_has_role(p_role_code)`:** Enforza los permisos de creación y transiciones de estado basados en roles de usuario (`EJECUTIVO_COMERCIAL`, `TECNICO_CAMPO`, `GERENTE_GENERAL`, etc.).
9.  **`dispatch_requirement_events()` / `dispatch_document_events()`:** Emite hitos comerciales a la tabla de `business_events` (`REQUIREMENT_CREATED`, `REQUIREMENT_CANCELLED`, `DOCUMENT_VERSION_CREATED`, etc.).
10. **`block_physical_requirement_delete()` / `block_physical_document_delete()`:** Bloquea de forma definitiva la ejecución de comandos `DELETE` físicos en la base de datos.

### 1.3 Triggers de Base de Datos
*   `trg_handle_requirement_code` (BEFORE INSERT OR UPDATE on `requirements`)
*   `trg_handle_document_code` (BEFORE INSERT OR UPDATE on `documents`)
*   `trg_handle_document_versioning` (BEFORE INSERT on `documents`)
*   `trg_handle_requirement_traceability` (BEFORE INSERT OR UPDATE on `requirements`)
*   `trg_validate_requirement_state` (BEFORE UPDATE OF status on `requirements`)
*   `trg_enforce_requirement_permissions` (BEFORE INSERT OR UPDATE OF status on `requirements`)
*   `trg_dispatch_requirement_events` (AFTER INSERT OR UPDATE on `requirements`)
*   `trg_dispatch_document_events` (AFTER INSERT OR UPDATE on `documents`)
*   `trg_block_physical_requirement_delete` (BEFORE DELETE on `requirements`)
*   `trg_block_physical_document_delete` (BEFORE DELETE on `documents`)
*   `audit_requirements` (AFTER INSERT OR UPDATE OR DELETE on `requirements` $\rightarrow$ `process_audit_log`)
*   `audit_documents` (AFTER INSERT OR UPDATE OR DELETE on `documents` $\rightarrow$ `process_audit_log`)

### 1.4 Políticas RLS creadas
Para ambas tablas (`requirements` y `documents`) se habilitó Row Level Security con las siguientes políticas:
*   `_super_admin`: Bypass completo de lectura/escritura para el Super Administrador.
*   `_select_tenant`: Filtrado por tenant del usuario autenticado; permite visualización de registros soft-deleted únicamente para usuarios con rol `AUDITOR`.
*   `_insert_tenant`: Restringe la creación para que el `tenant_id` coincida con la sesión.
*   `_update_tenant`: Restringe la modificación al tenant propio y bloquea cambios sobre registros soft-deleted.

---

## 2. Reporte de Pruebas Ejecutadas

### 2.1 Verificación Sintáctica y Estructural
Se ejecutó de forma local el script de verificación sintáctica:
```bash
npm run test:requirements
```
**Resultado:** ÉXITO. Se validó la correcta existencia física y sintáctica de todas las tablas, triggers, llaves foráneas, políticas de seguridad RLS y funciones PL/pgSQL en el archivo de migración `20260617000003_requirements_core.sql`.

---

## 3. Errores Encontrados y Corregidos

1.  **Helper `get_current_user_id()` inexistente:**
    *   *Error:* Se hacía referencia al helper en el diseño de triggers de trazabilidad, pero la base de datos no lo tenía definido globalmente.
    *   *Corrección:* Se implementó la función modular `get_current_user_id()` al inicio del archivo de migración para centralizar la obtención del ID cruzando con `auth.uid()`.
2.  **Ambigüedad en Roles y Asignaciones de Pruebas:**
    *   *Error:* En los tests del script de requerimientos previo, no se asignaban roles a los usuarios mock, lo que causaba fallos en el trigger `enforce_requirement_permissions`.
    *   *Corrección:* Se actualizó el script `test-requirements.ts` para mapear los roles sembrados (`EJECUTIVO_COMERCIAL`, `TECNICO_CAMPO`, `GERENTE_GENERAL`) y asignarlos a los usuarios de prueba antes de realizar las validaciones de transiciones de estado.

---

## 4. Pendientes para FASE 4 (Cotizaciones)

*   **Integración de Cotizaciones:** En la Fase 4 se definirá la tabla `quotes`. Se deberá actualizar el trigger `validate_requirement_state_transitions` de requerimientos para que la transición del estado `COTIZACION` a `APROBACION` valide físicamente que la cotización asociada se encuentre en estado aprobada o vigente en la tabla de cotizaciones, removiendo la simulación/mock actual.
