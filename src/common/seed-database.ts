import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { auth } from '../core/auth';
import {
  Cargo,
  CondicaoEquipamento,
  PrismaClient,
  StatusCadastro,
  StatusChamado,
  StatusInventario,
  StatusOperacional,
  TipoEvento,
  TipoProprietario,
} from '../core/prisma/generated/client';

export async function seedDatabase() {
  const logger = new Logger('SeedDatabase');
  logger.log('Iniciando o povoamento de dados pré-cadastrados (Seeds)...');

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Proprietários
    logger.log('Cadastrando proprietários...');
    const propPrefeitura = await prisma.proprietario.upsert({
      where: { id: '018f0001-0000-7000-8000-000000000001' },
      update: {},
      create: {
        id: '018f0001-0000-7000-8000-000000000001',
        nome: 'Prefeitura Municipal de Cidade Educar',
        tipo: TipoProprietario.PROPRIO,
        telefone: '(11) 3000-0000',
        email: 'patrimonio@cidadeeducar.sp.gov.br',
        observacoes: 'Patrimônio oficial do município.',
      },
    });

    const propTerceirizado = await prisma.proprietario.upsert({
      where: { id: '018f0001-0000-7000-8000-000000000002' },
      update: {},
      create: {
        id: '018f0001-0000-7000-8000-000000000002',
        nome: 'TechRent Soluções em Informática Ltda.',
        tipo: TipoProprietario.TERCEIRIZADO,
        telefone: '(11) 4004-9999',
        email: 'contato@techrent.com.br',
        observacoes: 'Contrato de locação de equipamentos nº 45/2024.',
      },
    });

    // 2. Tipos de Equipamento e Configurações de Manutenção
    logger.log('Cadastrando tipos de equipamento e cronogramas de manutenção...');
    const tipos = [
      { nome: 'COMPUTADOR', desc: 'Computador de Mesa / Desktop', dias: 180 },
      { nome: 'NOTEBOOK', desc: 'Notebook Portátil', dias: 180 },
      { nome: 'IMPRESSORA', desc: 'Impressora Multifuncional', dias: 90 },
      { nome: 'PROJETOR', desc: 'Projetor Multimídia', dias: 120 },
      { nome: 'ROTEADOR', desc: 'Roteador Wi-Fi / Redes', dias: 180 },
      { nome: 'SWITCH', desc: 'Switch de Comunicação de Dados', dias: 180 },
      { nome: 'LOUSA_DIGITAL', desc: 'Lousa Digital Interativa', dias: 180 },
      { nome: 'TABLET', desc: 'Tablet Educacional', dias: 90 },
    ];

    const tipoMap = new Map<string, string>();

    for (const item of tipos) {
      const t = await prisma.tipoEquipamento.upsert({
        where: { nome: item.nome },
        update: {},
        create: {
          nome: item.nome,
          descricao: item.desc,
        },
      });

      tipoMap.set(item.nome, t.id);

      await prisma.configuracaoManutencao.upsert({
        where: { tipoEquipamentoId: t.id },
        update: { intervaloDias: item.dias },
        create: {
          tipoEquipamentoId: t.id,
          intervaloDias: item.dias,
        },
      });
    }

    // 3. Escolas
    logger.log('Cadastrando escolas municipais...');
    const escolaJoao23 = await prisma.escola.upsert({
      where: { codigoInep: '35012345' },
      update: {},
      create: {
        nome: 'Escola Municipal João XXIII',
        codigoInep: '35012345',
        endereco: 'Rua das Flores, 123 - Centro',
        telefone: '(11) 3333-1001',
        email: 'em.joao23@cidadeeducar.sp.gov.br',
      },
    });

    const escolaAlencar = await prisma.escola.upsert({
      where: { codigoInep: '35067890' },
      update: {},
      create: {
        nome: 'Escola Municipal José de Alencar',
        codigoInep: '35067890',
        endereco: 'Av. Brasil, 456 - Jardim Paulista',
        telefone: '(11) 3333-1002',
        email: 'em.alencar@cidadeeducar.sp.gov.br',
      },
    });

    const escolaLobato = await prisma.escola.upsert({
      where: { codigoInep: '35099887' },
      update: {},
      create: {
        nome: 'Escola Municipal Monteiro Lobato',
        codigoInep: '35099887',
        endereco: 'Rua dos Estudantes, 789 - Vila Nova',
        telefone: '(11) 3333-1003',
        email: 'em.lobato@cidadeeducar.sp.gov.br',
      },
    });

    // 4. Usuários com Credenciais de Login
    logger.log('Cadastrando usuários e perfis de acesso...');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Password123!';

    const usuariosParaCriar = [
      {
        email: 'gestor.seduc@sige.gov.br',
        name: 'Carlos Silva',
        matricula: 'SED-001',
        cargo: Cargo.GESTOR_SEDUC,
        role: 'admin',
        escolaId: null,
      },
      {
        email: 'admin.seduc@sige.gov.br',
        name: 'Mariana Costa',
        matricula: 'SED-002',
        cargo: Cargo.ADMINISTRADOR_SEDUC,
        role: 'admin',
        escolaId: null,
      },
      {
        email: 'diretor.joao23@escola.gov.br',
        name: 'Ana Oliveira',
        matricula: 'DIR-101',
        cargo: Cargo.DIRETOR_ESCOLAR,
        role: 'user',
        escolaId: escolaJoao23.id,
      },
      {
        email: 'tecnico.joao23@escola.gov.br',
        name: 'Pedro Santos',
        matricula: 'TEC-102',
        cargo: Cargo.TECNICO,
        role: 'user',
        escolaId: escolaJoao23.id,
      },
      {
        email: 'estagiario.joao23@escola.gov.br',
        name: 'Lucas Mendes',
        matricula: 'EST-103',
        cargo: Cargo.ESTAGIARIO,
        role: 'user',
        escolaId: escolaJoao23.id,
      },
      {
        email: 'diretor.alencar@escola.gov.br',
        name: 'Roberto Souza',
        matricula: 'DIR-201',
        cargo: Cargo.DIRETOR_ESCOLAR,
        role: 'user',
        escolaId: escolaAlencar.id,
      },
      {
        email: 'tecnico.alencar@escola.gov.br',
        name: 'Fernanda Lima',
        matricula: 'TEC-202',
        cargo: Cargo.TECNICO,
        role: 'user',
        escolaId: escolaAlencar.id,
      },
    ];

    const userMap = new Map<string, string>();

    for (const u of usuariosParaCriar) {
      let existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        try {
          const res = await auth.api.createUser({
            body: {
              email: u.email,
              name: u.name,
              password: defaultPassword,
              role: u.role,
            },
          });
          existing = res.user;
        } catch (_err) {
          existing = await prisma.user.findUnique({ where: { email: u.email } });
        }
      }

      if (existing) {
        await prisma.user.update({
          where: { id: existing.id },
          data: {
            matricula: u.matricula,
            cargo: u.cargo,
            escolaId: u.escolaId,
            emailVerified: true,
          },
        });
        userMap.set(u.email, existing.id);
      }
    }

    const gestorSeducId = userMap.get('gestor.seduc@sige.gov.br')!;
    const tecnicoJoao23Id = userMap.get('tecnico.joao23@escola.gov.br')!;

    // 5. Equipamentos
    logger.log('Cadastrando equipamentos demonstrativos...');

    // Equipamento 1: Notebook Operante (Propriedade Prefeitura na Escola João XXIII)
    const eq1 = await prisma.equipamento.upsert({
      where: { patrimonio: 'PAT-1001' },
      update: {},
      create: {
        patrimonio: 'PAT-1001',
        numeroSerie: 'SN-DELL-98765',
        tipoEquipamentoId: tipoMap.get('NOTEBOOK')!,
        proprietarioId: propPrefeitura.id,
        marca: 'Dell',
        modelo: 'Latitude 3420',
        dataAquisicao: new Date('2024-01-15'),
        escolaAtualId: escolaJoao23.id,
        qrCode: 'QR-NOTEBOOK-PAT-1001',
        statusOperacional: StatusOperacional.OPERANTE,
        statusCadastro: StatusCadastro.APROVADO,
        condicao: CondicaoEquipamento.EXCELENTE,
        observacoes: 'Utilizado no laboratório de informática.',
      },
    });

    // Equipamento 2: Computador Desktop em Manutenção (Escola João XXIII)
    const eq2 = await prisma.equipamento.upsert({
      where: { patrimonio: 'PAT-1002' },
      update: {},
      create: {
        patrimonio: 'PAT-1002',
        numeroSerie: 'SN-HP-12345',
        tipoEquipamentoId: tipoMap.get('COMPUTADOR')!,
        proprietarioId: propPrefeitura.id,
        marca: 'HP',
        modelo: 'ProDesk 400 G6',
        dataAquisicao: new Date('2023-05-10'),
        escolaAtualId: escolaJoao23.id,
        qrCode: 'QR-COMPUTADOR-PAT-1002',
        statusOperacional: StatusOperacional.EM_MANUTENCAO,
        statusCadastro: StatusCadastro.APROVADO,
        condicao: CondicaoEquipamento.RUIM,
        observacoes: 'Apresentando falhas na fonte de alimentação.',
      },
    });

    // Equipamento 3: Impressora Terceirizada (Escola José de Alencar)
    await prisma.equipamento.upsert({
      where: { qrCode: 'QR-IMPRESSORA-TERC-001' },
      update: {},
      create: {
        patrimonio: null,
        numeroSerie: 'SN-EPSON-8821',
        tipoEquipamentoId: tipoMap.get('IMPRESSORA')!,
        proprietarioId: propTerceirizado.id,
        marca: 'Epson',
        modelo: 'EcoTank L3250',
        dataAquisicao: new Date('2024-03-01'),
        dataDevolucao: new Date('2026-03-01'),
        escolaAtualId: escolaAlencar.id,
        qrCode: 'QR-IMPRESSORA-TERC-001',
        statusOperacional: StatusOperacional.OPERANTE,
        statusCadastro: StatusCadastro.APROVADO,
        condicao: CondicaoEquipamento.BOM,
        observacoes: 'Equipamento locado da TechRent.',
      },
    });

    // Equipamento 4: Projetor Operante (Escola Monteiro Lobato)
    await prisma.equipamento.upsert({
      where: { patrimonio: 'PAT-1004' },
      update: {},
      create: {
        patrimonio: 'PAT-1004',
        numeroSerie: 'SN-EPSON-PROJ-551',
        tipoEquipamentoId: tipoMap.get('PROJETOR')!,
        proprietarioId: propPrefeitura.id,
        marca: 'Epson',
        modelo: 'PowerLite E20',
        dataAquisicao: new Date('2023-08-20'),
        escolaAtualId: escolaLobato.id,
        qrCode: 'QR-PROJETOR-PAT-1004',
        statusOperacional: StatusOperacional.OPERANTE,
        statusCadastro: StatusCadastro.APROVADO,
        condicao: CondicaoEquipamento.BOM,
        observacoes: 'Instalado no auditório principal.',
      },
    });

    // 6. Inventários
    logger.log('Cadastrando inventários de demonstração...');
    const inventarioJoao23 = await prisma.inventario.upsert({
      where: { id: '018f0002-0000-7000-8000-000000000001' },
      update: {},
      create: {
        id: '018f0002-0000-7000-8000-000000000001',
        escolaId: escolaJoao23.id,
        criadoPorId: tecnicoJoao23Id,
        status: StatusInventario.APROVADO,
        enviadoDiretorEm: new Date('2024-02-01'),
        aprovadoDiretorEm: new Date('2024-02-02'),
        enviadoSeducEm: new Date('2024-02-03'),
        aprovadoSeducEm: new Date('2024-02-05'),
      },
    });

    // Itens de Inventário
    await prisma.itemInventario.createMany({
      skipDuplicates: true,
      data: [
        {
          inventarioId: inventarioJoao23.id,
          patrimonio: 'PAT-1001',
          numeroSerie: 'SN-DELL-98765',
          tipoEquipamentoId: tipoMap.get('NOTEBOOK')!,
          marca: 'Dell',
          modelo: 'Latitude 3420',
          condicao: CondicaoEquipamento.EXCELENTE,
          observacoes: 'Equipamento verificado no lab.',
        },
        {
          inventarioId: inventarioJoao23.id,
          patrimonio: 'PAT-1002',
          numeroSerie: 'SN-HP-12345',
          tipoEquipamentoId: tipoMap.get('COMPUTADOR')!,
          marca: 'HP',
          modelo: 'ProDesk 400 G6',
          condicao: CondicaoEquipamento.REGULAR,
          observacoes: 'Fonte fazendo ruído elevado.',
        },
      ],
    });

    // 7. Inspeções e Chamados Corretivos
    logger.log('Cadastrando inspeções e chamados corretivos...');

    // Inspeção no Equipamento 2
    const inspecaoEq2 = await prisma.inspecao.create({
      data: {
        equipamentoId: eq2.id,
        usuarioId: tecnicoJoao23Id,
        dataRealizacao: new Date('2024-06-10'),
        condicaoEncontrada: CondicaoEquipamento.RUIM,
        observacoes:
          'Inspeção preventiva identificou superaquecimento e desarmamento automático da fonte.',
        aprovadoDiretor: true,
        aprovadoEm: new Date('2024-06-11'),
      },
    });

    // Chamado Corretivo gerado a partir da inspeção
    await prisma.chamadoCorretivo.create({
      data: {
        equipamentoId: eq2.id,
        abertoPorId: tecnicoJoao23Id,
        inspecaoId: inspecaoEq2.id,
        descricao:
          'Computador desliga sozinho após 10 minutos de uso. Necessária troca da fonte ATX 500W.',
        status: StatusChamado.EM_ATENDIMENTO,
      },
    });

    // 8. Histórico e Movimentação
    logger.log('Cadastrando histórico de ciclo de vida e movimentações...');

    await prisma.historicoEquipamento.createMany({
      skipDuplicates: true,
      data: [
        {
          equipamentoId: eq1.id,
          usuarioId: gestorSeducId,
          tipoEvento: TipoEvento.CADASTRO,
          descricao: 'Equipamento cadastrado no sistema pela SEDUC.',
          dataEvento: new Date('2024-01-15'),
        },
        {
          equipamentoId: eq1.id,
          usuarioId: gestorSeducId,
          tipoEvento: TipoEvento.MOVIMENTACAO,
          descricao: `Equipamento alocado na escola ${escolaJoao23.nome}.`,
          dataEvento: new Date('2024-01-16'),
        },
        {
          equipamentoId: eq2.id,
          usuarioId: tecnicoJoao23Id,
          tipoEvento: TipoEvento.MANUTENCAO_ABERTA,
          descricao: 'Chamado corretivo de substituição de fonte de alimentação aberto.',
          dataEvento: new Date('2024-06-10'),
        },
      ],
    });

    logger.log('Seeds executadas com sucesso! Dados prontos para demonstração.');
  } catch (error) {
    logger.error('Erro ao executar seeds:', error instanceof Error ? error.stack : String(error));
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
