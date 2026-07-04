# Contexto e Padrões do Projeto - SIGE Backend

Este documento estabelece a arquitetura, estrutura de pastas, convenções de código, padrões de tratamento de erro, autenticação e regras de documentação da API para a plataforma **SIGE Backend**. Deve ser consultado por desenvolvedores e assistentes de IA antes e durante o desenvolvimento.

---

## 🏗️ 1. Arquitetura e Estrutura de Pastas

O projeto é construído sobre **NestJS 11**, **Prisma ORM (v7)** com adaptador PostgreSQL, **Better Auth** para autenticação e RBAC, **Zod / nestjs-zod** para validações e DTOs, **Pino** para logging estruturado e **Biome** para linting e formatação. O gerenciador de pacotes padrão é o **npm**.

```text
SIGE-backend/
├── .env / .env.example       # Variáveis de ambiente e template
├── biome.json                # Configuração do Biome (linter/formatter)
├── docker-compose.yml        # Container PostgreSQL para dev/testes
├── nest-cli.json             # Configuração do Nest CLI
├── package.json              # Dependências e scripts npm
├── tsconfig.json             # Configuração do TypeScript
├── context.md                # Diretrizes e padrões do projeto
└── src/
    ├── app.module.ts         # Módulo raiz da aplicação
    ├── app.registry.ts       # Registro do contexto da aplicação (para helpers estáticos)
    ├── main.ts               # Ponto de entrada (bootstrap NestJS, Swagger, CORS, Helmet, Pipes, Filters)
    ├── config/               # Validação de ambiente e serviço de configuração central
    │   ├── config.module.ts
    │   ├── config.service.ts
    │   ├── env.schema.ts
    │   └── index.ts
    ├── common/               # Utilitários globais, DTOs, exceções, pipes e schemas reutilizáveis
    │   ├── constants/        # Schemas OpenAPI de erro e opções padrão (ex: api-response-schemas.ts)
    │   ├── dto/              # DTOs genéricos (genericResponseDto, idOnlyResponseDto, nullResponseDto, etc.)
    │   ├── exceptions/       # Exceções personalizadas (AppException, IAppExceptionResponse)
    │   ├── pipes/            # Pipes customizados (CustomParseFilePipe, RequestParameterIdPipe)
    │   ├── schemas/          # Helpers de schema Zod (ex: dateToIsoString)
    │   ├── templates/        # Templates de e-mail (Pug)
    │   └── setup-admin.ts    # Script de criação/inicialização do usuário administrador inicial
    ├── core/                 # Módulos de infraestrutura e serviços globais da aplicação
    │   ├── auth/             # Autenticação Better Auth (auth.ts, config, roles, decorators, module)
    │   ├── docs/             # Setup de documentação automática OpenAPI/Scalar (@scalar/nestjs-api-reference)
    │   ├── events/           # Módulo global de eventos (@nestjs/event-emitter)
    │   ├── filters/          # Filtro global de exceções HTTP (HttpExceptionFilter)
    │   ├── health/           # Endpoints de Health Check (@nestjs/terminus)
    │   ├── logger/           # Serviço e módulo de log estruturado (Pino)
    │   ├── prisma/           # Serviço, módulo e schema.prisma do Prisma ORM
    │   └── security/         # Configurações de CORS, Helmet e cabeçalhos de segurança
    └── features/             # Módulos de negócio da aplicação (organizados por domínio)
        └── <modulo>/
            ├── dto/                  # DTOs específicos da feature baseados em Zod
            ├── <modulo>.controller.ts # Controller HTTP da feature
            ├── <modulo>.module.ts     # Módulo NestJS da feature
            ├── <modulo>.service.ts    # Regras de negócio e integração com banco
            └── <modulo>.e2e.spec.ts   # Testes E2E automatizados da feature
```

---

## 📝 2. Regras de Documentação Automática (OpenAPI / Swagger)

Todo endpoint da API deve ser **100% documentado** via decorators OpenAPI do `@nestjs/swagger` e `nestjs-zod`. A documentação é servida via **Scalar API Reference** em `/docs`.

### Diretrizes Obrigatórias:

1. **Imports de DTOs e Services (OBRIGATÓRIO):**
   * Use **SEMPRE** imports regulares (sem a palavra `type`) para DTOs e Services em Controllers e Services.
   * **NUNCA use** `import type { XDto } from ...` ou `import type { XService } from ...`. O NestJS depende da reflexão de tipos em runtime (`emitDecoratorMetadata`) para injeção de dependência e geração dos schemas do Swagger.
   * *Exemplo correto:* `import { CreateUserDto } from './dto/create-user.dto';`

2. **Descrições em Schemas Zod:**
   * Adicione `.describe('Descrição clara do campo')` em todas as propriedades dos schemas Zod. A biblioteca `nestjs-zod` converte essas descrições para a especificação OpenAPI.

3. **Datas em JSON Schema:**
   * **NUNCA** use `z.date()` ou `z.coerce.date()` diretamente nos schemas de DTO (causa o erro `Date cannot be represented in JSON Schema` na inicialização).
   * Para **respostas (output)**: Use o helper `dateToIsoString` localizado em `@common/schemas/date-to-string`.
   * Para **entradas (query/body input)**: Aceite `z.string().datetime()` e converta para `Date` no controller/service se necessário.

4. **Decorators de Rota nos Controllers:**
   * `@ApiTags('NomeDoModulo')` no controller.
   * `@ApiBearerAuth()` caso o controller/endpoint necessite de autenticação.
   * `@ApiOperation({ summary: 'Resumo da ação', description: 'Explicação detalhada...' })` em todas as rotas.
   * `@ZodResponse({ status: 200|201, type: Dto, description: '...' })` para retornos com sucesso.
   * `@ApiResponse({ status: 400, description: 'Erro de validação', schema: validationErrorSchema })`.
   * `@ApiResponse({ status: 403, description: 'Acesso negado', schema: businessLogicErrorSchema })`.

5. **Otimização de Schemas (`$ref` para geradores de código como Orval):**
   * Defina um ID nos schemas Zod base usando `.meta({ id: 'NomeDoModel' })`.
   * Crie as classes com `createZodDto()`.

### Exemplo Estrito de Controller Documentado:

```typescript
import { Controller, Get, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { z } from 'zod';
import { Roles, AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomParseFilePipe } from '@common/pipes/custom-parse-file.pipe';
import { validationErrorSchema, businessLogicErrorSchema } from '@common/constants/api-response-schemas';

export const UserSchema = z.object({
  id: z.string().uuid().describe('UUID único do usuário'),
  name: z.string().describe('Nome completo do usuário'),
  email: z.string().email().describe('E-mail do usuário'),
}).meta({ id: 'User' });

export class UserDto extends createZodDto(UserSchema) {}
export class CreateUserDto extends createZodDto(UserSchema.omit({ id: true })) {}

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UserController {
  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Listar usuários', description: 'Retorna a lista de usuários públicos.' })
  @ZodResponse({ status: 200, type: [UserDto], description: 'Lista retornada com sucesso' })
  @ApiResponse({ status: 400, description: 'Erro de validação', schema: validationErrorSchema })
  async getUsers() {
    // ...
  }

  @Roles(['admin'])
  @Post()
  @ApiOperation({ summary: 'Criar usuário', description: 'Cria um novo usuário administrativo.' })
  @ZodResponse({ status: 201, type: UserDto, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 403, description: 'Acesso negado', schema: businessLogicErrorSchema })
  async createUser(@Body() dto: CreateUserDto) {
    // ...
  }
}
```

---

## ⚠️ 3. Estrutura de Respostas HTTP e Tratamento de Erros

A aplicação utiliza um filtro global de exceções (`HttpExceptionFilter`) que padroniza as respostas de erro em três formatos estruturados:

### 3.1. Erro de Validação (`400 Bad Request`)
Disparado automaticamente quando um payload/query falha na validação do Zod:
```json
{
  "errors": [
    {
      "type": "validation",
      "message": "O campo nome é obrigatório",
      "field": "name"
    }
  ],
  "error_code": "VALIDATION_ERROR"
}
```
*Schema Swagger:* `validationErrorSchema` de `@common/constants/api-response-schemas`.

### 3.2. Erro de Regra de Negócio / Exceção da Aplicação (`4xx` / `5xx`)
Lançado via `AppException` para erros intencionais da lógica de negócio:
```json
{
  "error": {
    "type": "business_logic",
    "message": "Credenciais inválidas.",
    "error_code": "INVALID_CREDENTIALS"
  }
}
```
*Schema Swagger:* `businessLogicErrorSchema` de `@common/constants/api-response-schemas`.

#### Como lançar exceções na aplicação:
```typescript
import { AppException } from '@common/exceptions/app.exception';

// Exemplos:
throw AppException.badRequest('E-mail já cadastrado.', 'DUPLICATE_ENTRY');
throw AppException.notFound('Usuário não encontrado.');
throw AppException.forbidden('Permissão insuficiente.');
throw AppException.unauthorized('Sessão expirada.');
throw AppException.conflict('Conflito de dados.');
```

### 3.3. Erro Desconhecido ou Inesperado (`500 Internal Server Error`)
Erros não capturados são mascarados para segurança do sistema e salvos nos logs via Pino:
```json
{
  "error": {
    "type": "unknown",
    "message": "Internal Server Error"
  }
}
```
*Schema Swagger:* `unknownErrorSchema` de `@common/constants/api-response-schemas`.

---

## 🔐 4. Autenticação e Controle de Acesso (RBAC)

* **Autenticação:** Baseada em **Better Auth** via cookies e headers Bearer.
* **Perfis (Roles):** `admin`, `professor`, `student`.
* **Decorators de Proteção:**
  * `@Roles(['admin'])` - Exige que o usuário autenticado possua uma das roles especificadas.
  * `@AllowAnonymous()` - Isenta a rota de autenticação obrigatória.
* **Sessão / Contexto:** Informações do usuário autenticado podem ser injetadas nos controllers via decorators do Better Auth.

---

## 🧪 5. Regras de Testes E2E Obrigatórios

Cada funcionalidade/módulo criado no projeto **deve conter testes End-to-End (E2E)**.

* **Localização:** `src/features/<modulo>/<modulo>.e2e.spec.ts`
* **Tecnologia:** Vitest + Supertest executados contra o banco PostgreSQL no Docker.
* **Casos Cobertos Obrigatórios:**
  1. **Caminho Feliz (200/201):** Validar payload retornado e gravação correta no banco.
  2. **Validação de Entrada (400):** Enviar payload inválido e checar estrutura de `VALIDATION_ERROR`.
  3. **Autenticação (401):** Requisição sem token em rota protegida.
  4. **Autorização (403):** Usuário sem a role necessária.
  5. **Recurso Não Encontrado (404):** ID inexistente (quando aplicável).
* **Execução:**
  ```bash
  npm run test        # Executa testes unitários/integrados
  ```

---

## 🛠️ 6. Scripts e Comandos Frequentes

```bash
# Desenvolvimento local
docker compose up -d           # Sobe o banco PostgreSQL
npm run start:dev             # Inicia o servidor NestJS em modo watch com .env

# Banco de Dados (Prisma)
npm run prisma:generate       # Gera o cliente Prisma em src/core/prisma/generated/client
npm run prisma:migrate:dev    # Executa migrations em ambiente de dev
npm run prisma:studio         # Abre a interface visual do banco de dados (Prisma Studio)

# Qualidade de Código
npm run lint                  # Verifica violações com o Biome
npm run lint:fix              # Corrige formatação e lint automaticamente

# Inicialização de Administrador Inicial
npm run setup-admin           # Executa o script src/common/setup-admin.ts
```

---

## 💡 7. Padrões de Código e Boas Práticas

1. **Injeção de Dependências:** Registre serviços e repositórios nos seus respectivos módulos NestJS.
2. **Separação de Responsabilidades:**
   * **Controllers:** Roteamento, validação de contrato, decorators de documentação e tratamento de resposta HTTP.
   * **Services:** Lógica de negócio, orquestração de transações com o Prisma e emissão de eventos.
3. **Gerenciador de Pacotes:** Use estritamente o **npm** (não utilize `pnpm` nem `yarn`).
4. **Convenção de Commits:** Siga o padrão *Conventional Commits* (ex: `feat: add student list endpoint`, `fix: correct date formatting in user response`).
