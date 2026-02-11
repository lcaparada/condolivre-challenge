# Controle de Risco de Concentração - Sistema de Empréstimos

Sistema para gestão de empréstimos com controle automatizado de risco de concentração geográfica, desenvolvido como solução para o desafio técnico da CondoLivre.

---

## 🚀 Quick Start

### Primeira vez? Execute:

```bash
make setup
```

Isso vai instalar dependências, subir o MongoDB no Docker e rodar os seeds.

### Iniciar a aplicação:

```bash
make run
```

Isso vai:

1. ✅ Iniciar MongoDB (Docker)
2. ✅ Rodar seeds do banco
3. ✅ Iniciar a API em modo desenvolvimento

### Endpoints disponíveis:

- 🌐 **API**: http://localhost:3333
- 📚 **Swagger UI**: http://localhost:3333/docs
- 🗄️ **MongoDB**: localhost:27017

### Outros comandos úteis:

```bash
make test         # Roda todos os testes
make docker-up    # Apenas inicia o MongoDB
make docker-down  # Para o MongoDB
make seed         # Apenas roda os seeds
```

---

## 📋 Sumário

- [Quick Start](#-quick-start)
- [Visão Geral](#visão-geral)
- [Decisões de Arquitetura](#decisões-de-arquitetura)
- [Stack Tecnológica](#stack-tecnológica)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Decisões Técnicas Detalhadas](#decisões-técnicas-detalhadas)
- [Como Executar (Detalhado)](#como-executar)
- [Testes](#testes)

---

## 🎯 Visão Geral

### Problema de Negócio

O sistema implementa controle de risco de concentração geográfica para uma empresa de empréstimos, garantindo que:

- **Máximo 10%** do valor total da carteira pode estar concentrado em um único estado
- **Máximo 20%** do valor total da carteira pode estar concentrado em São Paulo (SP)
- Empréstimos que violem essas regras devem ser **rejeitados automaticamente**

### Solução

API REST que valida essas regras **antes** de criar um novo empréstimo, calculando dinamicamente o impacto do novo empréstimo na concentração atual da carteira.

---

## 🏗️ Decisões de Arquitetura

### Clean Architecture + Domain-Driven Design (DDD)

Optei por uma arquitetura em camadas inspirada em Clean Architecture e DDD pelos seguintes motivos:

#### 1. **Separação de Responsabilidades**

```
domain/         → Regras de negócio puras (independente de frameworks)
application/    → Casos de uso e orquestração
infrastructure/ → Detalhes técnicos (MongoDB, HTTP)
presentation/   → Interface HTTP (Fastify, controllers)
```

**Por quê?**

- ✅ Regras de negócio isoladas e testáveis
- ✅ Fácil trocar MongoDB por outro banco
- ✅ Fácil trocar Fastify por Express
- ✅ Código mais legível e manutenível

#### 2. **Inversão de Dependências**

O domínio define **interfaces** (abstrações), a infraestrutura **implementa**:

```typescript
// Domínio define O QUE precisa
interface LoanRepository {
  save(loan: LoanEntity): Promise<LoanEntity>;
  getTotalAmount(): Promise<number>;
}

// Infraestrutura implementa COMO
class MongoLoanRepository implements LoanRepository {
  // Implementação com MongoDB
}
```

**Por quê?**

- ✅ Domínio não depende de detalhes de implementação
- ✅ Facilita testes (mocks)
- ✅ Permite múltiplas implementações (MongoDB, PostgreSQL, in-memory)

#### 3. **Camadas**

##### **Domain (Domínio)**

- **Entidades**: `LoanEntity`, `Entity` (base)
- **Value Objects**: `UF` (tipo brasileiro de estados)
- **Domain Services**: `ConcentrationRiskService` (lógica complexa de domínio)
- **Repository Interfaces**: Contratos de persistência
- **Errors**: Erros específicos do domínio

**Por quê?**

- ✅ Lógica de negócio em um só lugar
- ✅ Reutilizável em diferentes contextos
- ✅ Testável sem dependências externas

##### **Application (Aplicação)**

- **Use Cases**: `CreateLoanUseCase` (orquestra domínio e repositórios)
- **DTOs**: Input/Output dos casos de uso

**Por quê?**

- ✅ Orquestra fluxo da aplicação
- ✅ Transforma dados entre camadas
- ✅ Coordena transações

##### **Infrastructure (Infraestrutura)**

- **Repositórios MongoDB**: Implementação concreta
- **Modelos/Schemas**: Mapeamento para banco de dados
- **Database Connection**: Gerenciamento de conexão

**Por quê?**

- ✅ Isola detalhes técnicos
- ✅ Facilita mudanças de tecnologia

##### **Presentation (Apresentação)**

- **Controllers**: Lógica HTTP
- **Routes**: Definição de rotas
- **Schemas Zod**: Validação de entrada/saída
- **Plugins**: Error handlers, Swagger

**Por quê?**

- ✅ Separa lógica HTTP da lógica de negócio
- ✅ Validação forte de dados

---

## 🛠️ Stack Tecnológica

### Por que MongoDB?

✅ **Flexibilidade de Schema**: Fácil evolução do modelo de dados  
✅ **Agregações Poderosas**: Cálculos de concentração com `$group` e `$sum`  
✅ **Performance**: Índices compostos otimizam queries complexas  
✅ **Escalabilidade Horizontal**: Sharding para crescimento futuro

### Por que TypeScript?

✅ **Type Safety**: Detecta erros em tempo de compilação  
✅ **IntelliSense**: Autocompletar melhora produtividade  
✅ **Refactoring Seguro**: Mudanças propagam automaticamente  
✅ **Documentação Viva**: Tipos servem como documentação

### Por que Fastify?

✅ **Performance**: ~2x mais rápido que Express  
✅ **Schema-based**: Validação e documentação automática  
✅ **TypeScript First**: Suporte nativo e excelente tipagem  
✅ **Plugin System**: Arquitetura modular  
✅ **JSON Schema**: Validação automática com Zod

### Por que Zod?

✅ **TypeScript Inference**: Tipos gerados automaticamente  
✅ **Runtime Validation**: Valida dados em tempo de execução  
✅ **Composable**: Schemas reutilizáveis  
✅ **Error Messages**: Mensagens claras de validação

---

## 📁 Estrutura do Projeto

```
src/
├── domain/                           # Camada de Domínio (Regras de Negócio)
│   ├── constants/
│   │   ├── brazilian-states.ts       # Enum UF + validação
│   │   └── concentration-limits.ts   # Configuração de limites por estado
│   ├── entities/
│   │   ├── entity.ts                 # Classe base com UUID
│   │   └── loan.entity.ts            # Entidade de empréstimo
│   ├── errors/                       # Erros de domínio (HttpError)
│   ├── repositories/                 # Interfaces (abstrações)
│   └── services/
│       └── concentration-risk.service.ts  # Lógica de validação de risco
│
├── application/                      # Camada de Aplicação (Casos de Uso)
│   ├── dtos/
│   │   └── create-loan.dto.ts        # Input/Output DTOs
│   └── use-cases/
│       └── loan/
│           └── create-loan.use-case.ts  # Orquestra criação de empréstimo
│
├── infrastructure/                   # Camada de Infraestrutura
│   ├── database/
│   │   └── mongodb/
│   │       ├── models/               # Documentos MongoDB
│   │       ├── seeds/                # Scripts de seed
│   │       └── mongo-connection.ts   # Gerenciamento de conexão
│   └── repositories/                 # Implementações concretas
│       ├── mongo-loan.repository.ts
│       └── mongo-concentration-limit.repository.ts
│
├── presentation/                     # Camada de Apresentação (HTTP)
│   └── http/
│       ├── controllers/              # Lógica HTTP
│       ├── plugins/                  # Error handlers, etc
│       ├── routes/                   # Definição de rotas
│       └── schemas/                  # Validação Zod + Swagger
│
├── factories/                        # Dependency Injection
│   ├── make-repositories.ts
│   ├── make-services.ts
│   └── make-use-cases.ts
│
└── index.ts                          # Bootstrap da aplicação
```

---

## 🔧 Decisões Técnicas Detalhadas

### 1. Entidades e Validação

#### `LoanEntity` - Decisão: `amountInCents` ao invés de `amount`

```typescript
export interface LoanEntityProps {
  amountInCents: number; // ✅ Inteiro (centavos)
  uf: UF;
  createdAt?: Date;
}
```

**Por quê?**

- ❌ **Problema com floats**: `0.1 + 0.2 !== 0.3` em JavaScript
- ✅ **Precisão monetária**: Centavos são inteiros, sem arredondamento
- ✅ **Padrão da indústria**: Stripe, PayPal usam centavos
- ✅ **Validação**: `Number.isInteger()` garante integridade

**Exemplo:**

```typescript
// ❌ Ruim: R$ 100,50 → amount: 100.50 (problemas de precisão)
// ✅ Bom:  R$ 100,50 → amountInCents: 10050
```

#### Validação no Construtor

```typescript
constructor(props: LoanEntityProps, id?: string) {
  LoanEntity.validate(props);  // ✅ Valida ANTES de criar
  super({ ...props, createdAt: props.createdAt ?? new Date() }, id);
}
```

**Por quê?**

- ✅ **Fail-fast**: Erro imediato se dados inválidos
- ✅ **Invariantes garantidos**: Impossível criar entidade inválida
- ✅ **Segurança de tipo**: TypeScript + validação runtime

#### `createdAt` Automático

```typescript
createdAt: props.createdAt ?? new Date();
```

**Por quê?**

- ✅ **Auditoria**: Rastreamento temporal
- ✅ **Debugging**: Identificar problemas por período
- ✅ **Análise**: Relatórios por data
- ✅ **Índice MongoDB**: Queries por data eficientes

---

### 2. Validação de UF (Estados Brasileiros)

#### Decisão: Enum ao invés de Array

```typescript
export enum BrazilianStateCode {
  AC = 'AC',
  AL = 'AL', // ... 27 estados
}
```

**Por quê?**

- ✅ **Autocomplete**: IDE sugere valores válidos
- ✅ **Validação em compilação**: Erros antes de rodar
- ✅ **Zod integration**: `z.nativeEnum()` para validação

#### Função de Validação com Error Customizado

```typescript
export function assertValidUF(value: string): asserts value is UF {
  if (!isValidUF(value)) {
    throw new InvalidUFError(value); // ✅ Erro específico
  }
}
```

**Por quê?**

- ✅ **Type narrowing**: TypeScript sabe que depois é UF válido
- ✅ **Mensagens claras**: `InvalidUFError` retorna 400 com detalhes
- ✅ **Controle de fluxo**: Usa asserções do TypeScript

---

### 3. Índices do MongoDB

#### Decisão: Índice Composto `{ uf: 1, amountInCents: 1 }`

```typescript
await this.collection.createIndex(
  { uf: 1, amountInCents: 1 },
  { background: true, name: 'uf_amount_idx' }
);
```

**Por quê?**

- ✅ **Covered Query**: MongoDB lê apenas o índice, não os documentos
- ✅ **Agregação Otimizada**: `getAmountByState()` usa só o índice
- ✅ **Performance**: ~100x mais rápido em milhões de documentos

**Exemplo de uso:**

```typescript
// Esta query usa APENAS o índice (covered query)
db.loans.aggregate([{ $group: { _id: '$uf', total: { $sum: '$amountInCents' } } }]);
```

#### Decisão: `background: true`

```typescript
{
  background: true;
}
```

**Por quê?**

- ❌ **Sem background**: Bloqueia toda a coleção durante criação
- ✅ **Com background**: Sistema continua funcionando
- ✅ **Produção**: Essencial para não derrubar o sistema

#### Índice de `createdAt`

```typescript
await this.collection.createIndex({ createdAt: 1 }, { background: true });
```

**Por quê?**

- ✅ **Queries temporais**: Relatórios por período
- ✅ **TTL futuro**: Pode adicionar `expireAfterSeconds` para limpeza automática
- ✅ **Ordenação**: Listar empréstimos por data

---

### 4. Concentração: Salvamento no Banco

#### Decisão: Armazenar Limites de Concentração no MongoDB

```typescript
// Coleção: concentration_limits
{
  uf: 'SP',
  limit: 0.20  // 20%
}
{
  uf: 'DEFAULT',
  limit: 0.10  // 10%
}
```

**Por quê?**

- ✅ **Configurável**: Muda limites sem deploy
- ✅ **Por Estado**: Limites diferentes (SP = 20%, outros = 10%)
- ✅ **Escalável**: Fácil adicionar novas regras (por região, produto)
- ✅ **Auditável**: Histórico de mudanças de limites

#### Cache em Memória com TTL

```typescript
private cache: Map<string, { limit: number; timestamp: number }> = new Map();
private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
```

**Por quê?**

- ✅ **Performance**: Evita query no banco a cada empréstimo
- ✅ **TTL**: Atualiza automaticamente a cada 5 minutos
- ✅ **Trade-off**: Balanceia performance vs. atualização em tempo real

**Fluxo:**

```
1. Primeiro acesso → Query MongoDB → Salva no cache
2. Próximos 5min  → Lê do cache (sem query)
3. Após 5min      → Query MongoDB → Atualiza cache
```

#### Seed Script

```typescript
// seeds/seed-concentration-limits.ts
await db.collection('concentration_limits').insertMany([
  { uf: 'SP', limit: 0.2 },
  { uf: 'DEFAULT', limit: 0.1 },
]);
```

**Por quê?**

- ✅ **Dados iniciais**: Garante configuração padrão
- ✅ **Idempotente**: Pode rodar múltiplas vezes
- ✅ **Versionado**: Parte do código, não manual

---

### 5. Cálculo de Concentração

#### Fórmula Implementada

```typescript
const newTotalAmount = totalPortfolioAmount + newLoanAmount;
const newStateAmount = (amountByState[newLoanUf] || 0) + newLoanAmount;
const newConcentration = newStateAmount / newTotalAmount;

if (newConcentration > limit) {
  throw new ConcentrationLimitExceededError(/* ... */);
}
```

**Por quê?**

- ✅ **Proativo**: Calcula impacto ANTES de salvar
- ✅ **Atômico**: Valida e rejeita em uma operação
- ✅ **Preciso**: Usa valores exatos da carteira atual

#### Decisão: Permitir Primeiro Empréstimo

```typescript
if (totalPortfolioAmount === 0) {
  return; // ✅ Permite primeiro empréstimo
}
```

**Por quê?**

- ✅ **Cold start**: Sistema precisa iniciar vazio
- ✅ **Matemática**: 100/0 = infinito (não faz sentido)
- ✅ **Negócio**: Primeiro empréstimo sempre OK

---

### 6. Error Handling

#### Decisão: Interface `HttpError` para Padronização

```typescript
export interface HttpError extends Error {
  statusCode: number;
  toJSON(): {
    error: string;
    message: string;
    details?: unknown;
  };
}
```

**Por quê?**

- ✅ **Consistência**: Todos os erros seguem mesmo formato
- ✅ **Extensível**: Fácil adicionar novos erros
- ✅ **Type-safe**: TypeScript garante contrato

#### Plugin Centralizado de Erros

```typescript
fastify.setErrorHandler((error, request, reply) => {
  if (isHttpError(error)) {
    return reply.status(error.statusCode).send(error.toJSON());
  }
  // ... erro genérico
});
```

**Por quê?**

- ✅ **DRY**: Um único lugar para tratar erros
- ✅ **Escalável**: Novos erros automaticamente tratados
- ✅ **Logging**: Centraliza logs de erro

#### Erros Específicos

```typescript
class ConcentrationLimitExceededError extends Error implements HttpError {
  statusCode = 422; // Unprocessable Entity

  toJSON() {
    return {
      error: 'Concentration Limit Exceeded',
      message: this.message,
      details: { uf: this.uf, current: this.current, limit: this.limit },
    };
  }
}
```

**Por quê?**

- ✅ **Semântico**: Status code correto (422 vs 400 vs 500)
- ✅ **Detalhes**: Cliente recebe informações úteis
- ✅ **Debugging**: Fácil identificar problema

---

### 7. Dependency Injection com Factories

#### Decisão: Factories por Camada

```typescript
// factories/make-repositories.ts
export function makeRepositories(db: Db) {
  return {
    loanRepository: new MongoLoanRepository(db),
    concentrationLimitRepository: new MongoConcentrationLimitRepository(db),
  };
}

// factories/make-services.ts
export function makeServices(repositories: Repositories) {
  return {
    concentrationRiskService: new ConcentrationRiskService(
      repositories.concentrationLimitRepository
    ),
  };
}
```

**Por quê?**

- ✅ **Organização**: Dependências por camada
- ✅ **Type-safe**: `ReturnType<typeof makeRepositories>`
- ✅ **Testável**: Fácil mockar para testes
- ✅ **Manutenível**: `src/index.ts` limpo e pequeno

**Antes (ruim):**

```typescript
// ❌ index.ts ficava enorme com todas as instâncias
const loanRepo = new MongoLoanRepository(db);
const limitRepo = new MongoConcentrationLimitRepository(db);
const concentrationService = new ConcentrationRiskService(limitRepo);
const createLoanUseCase = new CreateLoanUseCase(loanRepo, concentrationService);
// ... dezenas de linhas
```

**Depois (bom):**

```typescript
// ✅ index.ts limpo
const repositories = makeRepositories(db);
const services = makeServices(repositories);
const useCases = makeUseCases(repositories, services);
```

---

### 8. Validação com Zod + Fastify

#### Decisão: Schemas Zod para Request/Response

```typescript
export const createLoanSchema = z.object({
  amountInCents: z.number().int().positive(),
  uf: z.nativeEnum(BrazilianStateCode),
});
```

**Por quê?**

- ✅ **Type inference**: `type CreateLoanInput = z.infer<typeof createLoanSchema>`
- ✅ **Runtime validation**: Valida dados do usuário
- ✅ **Swagger automático**: Documentação gerada automaticamente
- ✅ **Error messages**: Mensagens de validação claras

#### Integração com Fastify

```typescript
app.post(
  '/',
  {
    schema: {
      body: createLoanSchema,
      response: {
        201: createLoanResponseSchema,
        400: badRequestErrorSchema,
        422: unprocessableEntityErrorSchema,
      },
    },
  },
  handler
);
```

**Por quê?**

- ✅ **Documentação viva**: Swagger UI sempre atualizado
- ✅ **Contrato**: Cliente sabe exatamente o que enviar/receber
- ✅ **Validação automática**: Fastify valida antes de chamar handler

---

### 9. Testes

#### Decisão: Separação Unit vs Integration

```
domain/        → Unit tests (mocks, sem I/O)
application/   → Unit tests (mocks de repositórios)
infrastructure/ → Integration tests (MongoDB real)
presentation/  → Unit tests (mocks de use cases)
```

**Por quê?**

- ✅ **Rápidos**: Unit tests rodam em milissegundos
- ✅ **Confiança**: Integration tests validam persistência real
- ✅ **CI/CD**: Unit tests em todo commit, integration em deploy

#### MongoDB em Testes

```typescript
beforeAll(async () => {
  db = await connectToDatabase(); // Usa MONGODB_URI_TEST
}, 15000);

beforeEach(async () => {
  await db.collection('loans').deleteMany({}); // ✅ Limpa antes de cada teste
  await db.collection('loans').dropIndexes(); // ✅ Recria índices
  await repository.ensureIndexes();
});
```

**Por quê?**

- ✅ **Isolamento**: Cada teste começa limpo
- ✅ **Realista**: Testa comportamento real do MongoDB
- ✅ **Índices**: Garante que índices funcionam corretamente

---

## 🚀 Como Executar (Detalhado)

### Pré-requisitos

- Node.js 18+
- Docker (para MongoDB)
- Make

### Instalação Completa

```bash
# 1. Clone o repositório
git clone <repo-url>
cd condolivre-challenge

# 2. Configure variáveis de ambiente (opcional - já tem defaults)
cp .env.example .env
cp .env.example .env.test.local

# 3. Setup completo com um comando
make setup
```

### Comandos do Makefile

#### Desenvolvimento

```bash
make run          # Inicia TUDO (Docker + Seeds + API)
make dev          # Apenas inicia a API (hot reload)
make seed         # Apenas roda os seeds
```

#### Docker

```bash
make docker-up    # Inicia MongoDB
make docker-down  # Para MongoDB
```

#### Testes

```bash
make test         # Roda todos os testes
```

#### Comandos NPM (alternativo)

```bash
npm run dev             # Desenvolvimento (hot reload)
npm run seed            # Seeds
npm test                # Testes
npm run test:watch      # Testes em modo watch
npm run test:coverage   # Testes com coverage
npm run build           # Compila TypeScript
npm start               # Produção (depois de build)
```

### Configuração

**.env** (desenvolvimento)

```env
NODE_ENV=development
PORT=3333
MONGODB_URI=mongodb://localhost:27017/condolivre
```

**.env.test.local** (testes)

```env
NODE_ENV=test
MONGODB_URI_TEST=mongodb://localhost:27017/condolivre_test
PORT=3333
```

### Acessar

- **API**: http://localhost:3333
- **Swagger UI**: http://localhost:3333/docs
- **MongoDB**: mongodb://localhost:27017

---

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Específico
npm test -- loan.entity.spec.ts

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage
```

### Cobertura

O projeto tem **124 testes** cobrindo:

- ✅ Entidades e validações
- ✅ Serviços de domínio
- ✅ Casos de uso
- ✅ Repositórios (integration)
- ✅ Controllers
- ✅ Schemas Zod
- ✅ Factories

---

## 📊 Exemplos de Uso da API

### Criar Empréstimo (Sucesso)

```bash
curl -X POST http://localhost:3000/loans \
  -H "Content-Type: application/json" \
  -d '{
    "amountInCents": 1000000,
    "uf": "SP"
  }'
```

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "amountInCents": 1000000,
  "uf": "SP",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

### Criar Empréstimo (Limite Excedido)

```bash
curl -X POST http://localhost:3000/loans \
  -H "Content-Type: application/json" \
  -d '{
    "amountInCents": 50000000,
    "uf": "RJ"
  }'
```

**Response (422):**

```json
{
  "error": "Concentration Limit Exceeded",
  "message": "State RJ would exceed concentration limit",
  "details": {
    "uf": "RJ",
    "currentConcentration": 0.12,
    "limit": 0.1
  }
}
```

---

## 🔮 Evoluções Futuras

### Arquitetura Preparada Para:

1. **Novos Limites**
   - Por região (Nordeste, Sul, etc)
   - Por tipo de produto
   - Por perfil de cliente

2. **Event Sourcing**
   - Histórico de mudanças de limites
   - Auditoria completa

3. **Microserviços**
   - Domínio já isolado
   - Repositórios podem virar APIs

4. **Cache Distribuído**
   - Redis para cache compartilhado
   - Pub/Sub para invalidação

5. **Analytics**
   - Time-series com `createdAt`
   - Relatórios de concentração histórica

---

## 📝 Conclusão

Este projeto demonstra:

✅ **Arquitetura Limpa**: Separação clara de responsabilidades  
✅ **DDD**: Domínio rico e expressivo  
✅ **Type Safety**: TypeScript em todo código  
✅ **Performance**: Índices otimizados no MongoDB  
✅ **Testabilidade**: 124 testes com boa cobertura  
✅ **Documentação**: Swagger automático + README completo  
✅ **Escalabilidade**: Preparado para crescer

---

**Desenvolvido com ❤️ para o desafio técnico CondoLivre**
