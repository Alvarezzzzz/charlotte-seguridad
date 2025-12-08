# Modelos de datos (src/models)

Esta carpeta contiene la capa de acceso a datos de la aplicación. Cada archivo exporta una clase con métodos estáticos que interactúan con la base de datos usando Prisma Client. No realizan validaciones ni manejan respuestas HTTP; se enfocan en operaciones CRUD y consultas.

## Contenido
- `user.js`: operaciones sobre usuarios (crear, obtener por id, actualizar, eliminar, listar).
- `role.js`: operaciones sobre roles (incluye relaciones con usuarios y permisos).
- `permission.js`: operaciones sobre permisos (siempre asociados a un rol).
- `product.js`: operaciones sobre productos de ejemplo (usa el modelo Prisma `SecurityProductExample`).

## Convenciones
- Métodos estáticos con parámetros nombrados (objetos).
- Conversión de `id` a `Number` antes de usarlo en cláusulas `where`.
- Los nombres de modelos Prisma se usan en camelCase con primera letra minúscula (por ejemplo, `SecurityProductExample` → `prisma.securityProductExample`).

## Dependencias
- Prisma Client generado y configurado.
- Cliente Prisma exportado desde `src/db/client.js` (`prisma`).

## Ejemplo de uso
Importa el modelo en tu controlador y llama sus métodos:

```javascript
import { ProductModel } from "../models/product.js";

const newProduct = await ProductModel.create({
  input: { name: "Producto", quantity: 10, price: 9.99, stock: 5, category: "Electronics" }
});

const product = await ProductModel.findById({ id: 1 });

const updated = await ProductModel.update({ id: 1, input: { stock: 8 } });

await ProductModel.delete({ id: 1 });
```

## Notas
- Para relaciones M:N y 1:N (usuarios-roles, roles-permisos), puedes usar `include`/`select` en los métodos según necesidades.
