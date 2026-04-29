# Spinner en botones — regla anti-hydration error

## El error
```
Runtime NotFoundError: Failed to execute 'insertBefore' on 'Node':
The node before which the new node is to be inserted is not a child of this node.
```

Ocurre cuando dentro de un `<button>` (o componente que renderiza `<button>`) se mezcla
un elemento self-closing con texto como siblings directos:

```tsx
// ❌ MAL — causa hydration mismatch
<Button>
  <span className="flex items-center gap-2">
    <span className="animate-spin ..." />   {/* self-closing */}
    Cargando...                              {/* texto suelto */}
  </span>
</Button>

// ❌ MAL — div dentro de button es HTML inválido
<Button>
  <div className="animate-spin ..." />
  Cargando...
</Button>
```

## Por qué ocurre
React renderiza el spinner en el servidor como nodo vacío. Al hidratar en el cliente,
intenta insertar el nodo de texto junto a él y el DOM ya no coincide con lo que el
servidor envió → `insertBefore` falla.

## La solución
Encapsular siempre el spinner + texto en un componente dedicado que retorne
un único elemento raíz con **todos los hijos como elementos explícitos con cierre**:

```tsx
// ✅ BIEN — componente dedicado
function ButtonSpinner({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        role="status"
        aria-label="Cargando"
        className="block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
      ></span>
      <span>{label}</span>
    </span>
  );
}

// Uso:
<Button disabled={isLoading}>
  {isLoading ? <ButtonSpinner label="Guardando..." /> : 'Guardar'}
</Button>
```

## Reglas
1. Dentro de `<button>` solo elementos **inline**: `<span>`, `<svg>`, texto. Nunca `<div>`.
2. Nunca mezclar un elemento self-closing (`<span />`) con texto como siblings directos.
3. Siempre usar cierre explícito (`</span>`) cuando el elemento tiene siblings de texto.
4. Encapsular spinner + label en un componente propio para reutilizar y evitar el patrón.
