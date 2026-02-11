module.exports = {
  // Arquivos TypeScript/JavaScript
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix', // Corrige problemas de linting
    'prettier --write', // Formata o código
  ],

  // Arquivos JSON, Markdown, YAML
  '*.{json,md,yml,yaml}': [
    'prettier --write', // Apenas formatação
  ],

  // Roda testes apenas dos arquivos modificados
  '*.spec.ts': [
    'jest --bail --findRelatedTests', // Testa apenas os arquivos relacionados
  ],
};
