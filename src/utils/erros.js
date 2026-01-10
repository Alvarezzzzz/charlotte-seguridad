const getFormattedError = (error) => {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
};

const validarRecursosUnicos = (items) => {
  const vistos = new Set();

  for (const item of items) {
    const resourceNorm = item.resource.trim().toUpperCase();
    const methodNorm = item.method.trim().toUpperCase();

    const idUnico = `${resourceNorm}|${methodNorm}`;

    if (vistos.has(idUnico)) {
      return {
        esValido: false,
        mensaje: `Error: La combinación Resource: "${item.resource}" y Method: "${item.method}" ya existe.`,
      };
    }

    vistos.add(idUnico);
  }

  return { esValido: true, mensaje: "Todos los elementos son únicos." };
};

export { getFormattedError, validarRecursosUnicos };
