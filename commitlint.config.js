/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // nova funcionalidade
        'fix',      // correção de bug
        'security', // correção de segurança
        'refactor', // refatoração sem mudança de comportamento
        'perf',     // melhoria de performance
        'test',     // adição/correção de testes
        'docs',     // documentação
        'chore',    // tarefas de manutenção (deps, configs)
        'ci',       // CI/CD
        'revert',   // revert de commit
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 120],
  },
};
