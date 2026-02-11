import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega variáveis de ambiente para testes
config({ path: resolve(__dirname, '.env.test.local') });
