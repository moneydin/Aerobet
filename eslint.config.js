import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

const rulesConfig = firebaseRulesPlugin.configs ? firebaseRulesPlugin.configs['flat/recommended'] : {};

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*']
  },
  ...(Array.isArray(rulesConfig) ? rulesConfig : [rulesConfig])
];
