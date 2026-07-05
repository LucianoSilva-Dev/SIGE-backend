# SIGE Backend — Sistema Integrado de Gestão de Equipamentos
---

## 🔐 Dados de Teste & Credenciais Pré-cadastradas (Seeds)

O projeto conta com um script de **Seeds (`npm run seed`)** que popula automaticamente a base de dados com escolas, contas de teste com diferentes perfis, equipamentos e históricos.

### 🔑 Senha Padrão de Todos os Usuários de Teste:
> **`Password123!`** (ou valor configurado na variável de ambiente `ADMIN_PASSWORD`).

---

### 👤 Contas de Usuário por Perfil e Escopo

| Nome | E-mail | Cargo (Domain) | Role (Auth) | Escola Vinculada | Escopo de Acesso |
|---|---|---|---|---|---|
| **Carlos Silva** | `gestor.seduc@sige.gov.br` | `GESTOR_SEDUC` | `admin` | *Nenhuma (Global)* | Acesso total à rede municipal, aprovação final de inventários e remanejamentos |
| **Mariana Costa** | `admin.seduc@sige.gov.br` | `ADMINISTRADOR_SEDUC` | `admin` | *Nenhuma (Global)* | Acesso global para gestão de dados e relatórios da SEDUC |
| **Ana Oliveira** | `diretor.joao23@escola.gov.br` | `DIRETOR_ESCOLAR` | `user` | E.M. João XXIII | Restrito à Escola João XXIII (Aprovação de inventários e inspeções locais) |
| **Pedro Santos** | `tecnico.joao23@escola.gov.br` | `TECNICO` | `user` | E.M. João XXIII | Restrito à Escola João XXIII (Cadastro de inventário, inspeções e chamados) |
| **Lucas Mendes** | `estagiario.joao23@escola.gov.br` | `ESTAGIARIO` | `user` | E.M. João XXIII | Restrito à Escola João XXIII (Suporte técnico, inventário e inspeção) |
| **Roberto Souza** | `diretor.alencar@escola.gov.br` | `DIRETOR_ESCOLAR` | `user` | E.M. José de Alencar | Restrito à Escola José de Alencar |
| **Fernanda Lima** | `tecnico.alencar@escola.gov.br` | `TECNICO` | `user` | E.M. José de Alencar | Restrito à Escola José de Alencar |

---

### 🏫 Escolas Cadastradas

1. **Escola Municipal João XXIII** (Código INEP: `35012345`)
2. **Escola Municipal José de Alencar** (Código INEP: `35067890`)
3. **Escola Municipal Monteiro Lobato** (Código INEP: `35099887`)

---

### 💻 Equipamentos Cadastrados para Teste

- **PAT-1001** (Notebook Dell Latitude 3420)
  - **Escola**: E.M. João XXIII
  - **Status**: `OPERANTE` | **Condição**: `EXCELENTE`
  - **QR Code**: `QR-NOTEBOOK-PAT-1001`
- **PAT-1002** (Computador HP ProDesk 400 G6)
  - **Escola**: E.M. João XXIII
  - **Status**: `EM_MANUTENCAO` | **Condição**: `RUIM` (Com chamado corretivo aberto em atendimento)
  - **QR Code**: `QR-COMPUTADOR-PAT-1002`
- **Impressora Epson EcoTank L3250** (Equipamento Terceirizado - TechRent)
  - **Escola**: E.M. José de Alencar
  - **Status**: `OPERANTE` | **Condição**: `BOM`
  - **QR Code**: `QR-IMPRESSORA-TERC-001`
- **PAT-1004** (Projetor Epson PowerLite E20)
  - **Escola**: E.M. Monteiro Lobato
  - **Status**: `OPERANTE` | **Condição**: `BOM`
  - **QR Code**: `QR-PROJETOR-PAT-1004`

---

## 📋 Pré-requisitos & Ferramentas

Para executar o ambiente de desenvolvimento do **SIGE Backend**, certifique-se de ter instaladas as seguintes ferramentas em sua máquina:

| Ferramenta | Versão Recomendada | Descrição | Link / Documentação Oficial |
|---|---|---|---|
| **Node.js** | `v24.x` (LTS) | Ambiente de execução JavaScript | [Documentação Node.js](https://nodejs.org/pt-br/docs/) |
| **npm** | `v10.x` ou superior | Gerenciador de pacotes do Node.js | [Documentação npm](https://docs.npmjs.com/) |
| **Docker & Docker Compose** | Versão recente | Containerização do banco PostgreSQL | [Documentação Docker](https://docs.docker.com/) \| [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **Git** | Versão recente | Controle de versão de código | [Documentação Git](https://git-scm.com/doc) |

### 📚 Principais Tecnologias do Projeto
- **NestJS 11**: [Documentação Oficial NestJS](https://docs.nestjs.com/)
- **Prisma ORM 7**: [Documentação Oficial Prisma](https://www.prisma.io/docs)
- **Better Auth**: [Documentação Better Auth](https://www.better-auth.com/)
- **Zod / nestjs-zod**: [Documentação Zod](https://zod.dev/)

---

## 🛠️ Como Executar o Projeto Localmente

### 1. Instalar as dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente (.env)
Crie o arquivo `.env` na raiz do projeto a partir do modelo `.env.example`:

```bash
# Linux / macOS / Bash
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```
*Certifique-se de que o arquivo `.env` exista na raiz do projeto antes de iniciar o banco e a aplicação.*

### 3. Iniciar Banco PostgreSQL no Docker
```bash
docker compose up -d
```

### 4. Rodar Migrações e Seeds de Teste
```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run seed
```

### 5. Iniciar o Servidor de Desenvolvimento
```bash
npm run start:dev
```

- **API Base URL**: `http://localhost:3000`
- **Documentação de Rotas (Scalar / Swagger)**: `http://localhost:3000/docs`
- **Prisma Studio**: `npm run prisma:studio`
