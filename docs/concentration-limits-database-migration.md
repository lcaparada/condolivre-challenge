# Migração dos Limites de Concentração para o Banco de Dados

## ✅ O que foi implementado

### 1. **Modelo de dados** (`concentration-limit.model.ts`)
- Interface `ConcentrationLimitDocument` com campos:
  - `uf`: string | null (null = limite padrão)
  - `limit`: number (decimal, ex.: 0.2 = 20%)
  - `createdAt`, `updatedAt`: timestamps
- Função `toConcentrationLimitConfig` para converter documento → config

### 2. **Interface do repositório** (`concentration-limit.repository.ts`)
- `getLimitForState(uf)`: retorna limite específico ou null
- `getDefaultLimit()`: retorna limite padrão (10%)

### 3. **Implementação MongoDB** (`mongo-concentration-limit.repository.ts`)
- **Cache in-memory** com TTL de 5 minutos
- Índice único em `uf` para performance
- Método `ensureIndexes()` para criar índices
- Suporta case-insensitive (UF em maiúscula ou minúscula)

### 4. **Serviço atualizado** (`concentration-risk.service.ts`)
- Mudou de função pura → **classe `ConcentrationRiskService`**
- Recebe `ConcentrationLimitRepository` via **injeção de dependência**
- Método `validateConcentration()` agora é **async** (busca limites do repositório)
- Mantém todas as regras: primeiro empréstimo permitido, validação de concentração, etc.

### 5. **Seed script** (`seed-concentration-limits.ts`)
- Popula banco com limites iniciais:
  - `uf: null, limit: 0.1` (default 10%)
  - `uf: 'SP', limit: 0.2` (SP 20%)
- Script `run-seeds.ts` para executar: `npm run seed`
- Verifica se já existe seed antes de inserir

### 6. **Testes**
- **Domínio** (`concentration-risk.service.spec.ts`): 12 testes ✅
  - Mock do repositório
  - Testes de limites dinâmicos
  - Todos os cenários (primeiro loan, 10%, 20%, exceções)
- **Infraestrutura** (`mongo-concentration-limit.repository.spec.ts`): 10 testes criados
  - Testes de índices, cache, limites por estado
  - **Status**: escritos mas não rodados (timeout de conexão MongoDB nos testes)

## 🔄 Benefícios da mudança

| Aspecto | Antes (constante) | Depois (banco) |
|---------|-------------------|----------------|
| Mudança de limite | Deploy obrigatório | `UPDATE` no banco |
| Auditoria | Só via git | Timestamps + histórico no banco |
| Flexibilidade | Fixo em código | Dinâmico, pode ter interface admin |
| Performance | Lookup imediato | Cache (5min TTL) + query inicial |
| Evolução | Dif

ícil adicionar regras | Fácil: novos campos, limites por produto, vigência, etc. |

## 📝 Próximos passos

1. **Rodar seed** (quando MongoDB estiver disponível):
   ```bash
   npm run seed
   ```

2. **Criar caso de uso CreateLoan**:
   - Recebe `amount`, `uf`
   - Cria `LoanEntity`
   - Busca totais no `LoanRepository`
   - Instancia `ConcentrationRiskService` com `ConcentrationLimitRepository`
   - Chama `validateConcentration()`
   - Persiste ou lança erro

3. **API Fastify**:
   - Rota `POST /loans`
   - Trata erros (422 para concentração, 400 para validação)

## 🏗️ Arquitetura (Clean Architecture)

```
┌─────────────────────────────────────────┐
│ Domain                                  │
│  ├─ entities/loan.entity.ts             │
│  ├─ services/concentration-risk.service │
│  └─ repositories/ (INTERFACES)          │
│      ├─ loan.repository.ts              │
│      └─ concentration-limit.repository  │
└─────────────────────────────────────────┘
              ↑ depende de
┌─────────────────────────────────────────┐
│ Infrastructure                          │
│  └─ repositories/ (IMPLEMENTAÇÕES)      │
│      ├─ mongo-loan.repository.ts        │
│      └─ mongo-concentration-limit.repo  │
└─────────────────────────────────────────┘
```

**Inversão de dependência:**
- Domínio define **interface**
- Infraestrutura **implementa**
- Application/Main **injeta** implementação no serviço

## ⚠️ Nota sobre testes de integração

Os testes do repositório de limites precisam de MongoDB rodando. Para executar:
```bash
docker compose up -d    # Subir MongoDB
npm run seed            # Popular limites iniciais
npm test -- mongo-concentration-limit.repository.spec.ts
```
