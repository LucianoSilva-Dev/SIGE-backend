import { UserPayload } from '@common/decorators/current-user.decorator';
import { AppException } from '@common/exceptions/app.exception';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  EquipamentoDto,
  EquipamentosPaginatedDto,
  TipoEquipamentoDto,
} from './dto/equipamento-response.dto';
import { QueryEquipamentoDto } from './dto/query-equipamento.dto';
import { CreateEquipamentoDto } from './dto/create-equipamento.dto';

@Injectable()
export class EquipamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEquipamentoDto, user: UserPayload): Promise<EquipamentoDto> {
    if (user.cargo !== 'GESTOR_SEDUC' && user.cargo !== 'ADMINISTRADOR_SEDUC' && user.role !== 'admin') {
      throw AppException.forbidden('Apenas a SEDUC pode aprovar novos equipamentos.');
    }

    const tipoEquipamento = await this.prisma.tipoEquipamento.findUnique({ where: { id: dto.tipoEquipamentoId } });
    if (!tipoEquipamento) {
      throw AppException.notFound('Tipo de equipamento não encontrado.');
    }

    const proprietario = await this.prisma.proprietario.findUnique({ where: { id: dto.proprietarioId } });
    if (!proprietario) {
      throw AppException.notFound('Proprietário não encontrado.');
    }

    const escola = await this.prisma.escola.findUnique({ where: { id: dto.escolaAtualId } });
    if (!escola) {
      throw AppException.notFound('Escola de destino não encontrada.');
    }

    if (proprietario.tipo === 'PROPRIO' && !dto.patrimonio) {
      throw AppException.badRequest('Equipamentos próprios devem possuir patrimônio.');
    }

    return this.prisma.$transaction(async (tx) => {
      const equipamento = await tx.equipamento.create({
        data: {
          patrimonio: dto.patrimonio,
          numeroSerie: dto.numeroSerie,
          tipoEquipamentoId: dto.tipoEquipamentoId,
          proprietarioId: dto.proprietarioId,
          marca: dto.marca,
          modelo: dto.modelo,
          dataAquisicao: new Date(dto.dataAquisicao),
          escolaAtualId: dto.escolaAtualId,
          observacoes: dto.observacoes,
          statusCadastro: 'PENDENTE',
          ativo: false,
          statusOperacional: 'AGUARDANDO_DEVOLUCAO', // Use a placeholder status, or OPERANTE? Better: OPERANTE, but ativo=false hides it from active listings anyway.
        },
        include: {
          tipoEquipamento: true,
          escolaAtual: true,
          proprietario: true,
        },
      });

      await tx.equipamento.update({
        where: { id: equipamento.id },
        data: {
          statusOperacional: 'OPERANTE', // Default after creation
        }
      });

      await tx.historicoEquipamento.create({
        data: {
          equipamentoId: equipamento.id,
          usuarioId: user.id,
          tipoEvento: 'CADASTRO',
          descricao: `Equipamento cadastrado e enviado para escola ${escola.nome} (Aguardando Recebimento).`,
        },
      });

      return equipamento as unknown as EquipamentoDto;
    });
  }

  async confirmarRecebimento(id: string, user: UserPayload): Promise<EquipamentoDto> {
    if (user.cargo !== 'DIRETOR_ESCOLAR') {
      throw AppException.forbidden('Apenas o diretor escolar pode confirmar o recebimento do equipamento.');
    }

    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id },
      include: { escolaAtual: true },
    });

    if (!equipamento) {
      throw AppException.notFound('Equipamento não encontrado.');
    }

    if (equipamento.escolaAtualId !== user.escolaId) {
      throw AppException.forbidden('Este equipamento não foi destinado à sua escola.');
    }

    if (equipamento.statusCadastro !== 'PENDENTE') {
      throw AppException.conflict('Este equipamento não está aguardando confirmação de recebimento.');
    }

    const escolaCode = equipamento.escolaAtual.id.substring(0, 8).toUpperCase();
    const codeSuffix = equipamento.patrimonio || equipamento.numeroSerie || equipamento.id.substring(0, 8).toUpperCase();
    const qrCode = `SIGE-${escolaCode}-${codeSuffix}`;

    return this.prisma.$transaction(async (tx) => {
      const updatedEquipamento = await tx.equipamento.update({
        where: { id },
        data: {
          statusCadastro: 'APROVADO',
          ativo: true,
          qrCode,
        },
        include: {
          tipoEquipamento: true,
          escolaAtual: true,
          proprietario: true,
        },
      });

      await tx.historicoEquipamento.create({
        data: {
          equipamentoId: equipamento.id,
          usuarioId: user.id,
          tipoEvento: 'APROVACAO',
          descricao: 'Recebimento confirmado pelo diretor. Equipamento ativado.',
        },
      });

      return updatedEquipamento as unknown as EquipamentoDto;
    });
  }

  async findAll(query: QueryEquipamentoDto, user: UserPayload): Promise<EquipamentosPaginatedDto> {
    const {
      escolaId,
      tipoEquipamentoIds,
      tipos,
      condicao,
      statusOperacional,
      search,
      page = 1,
      limit = 20,
    } = query;

    const where: any = {
      ativo: true,
      statusCadastro: 'APROVADO',
    };

    // Escopo de escola por cargo do usuário
    const isSeduc =
      user.cargo === 'GESTOR_SEDUC' ||
      user.cargo === 'ADMINISTRADOR_SEDUC' ||
      user.role === 'admin';

    if (!isSeduc) {
      if (!user.escolaId) {
        throw AppException.forbidden('Usuário escolar não está vinculado a nenhuma escola.');
      }
      where.escolaAtualId = user.escolaId;
    } else if (escolaId) {
      where.escolaAtualId = escolaId;
    }

    // Filtros por Múltiplas Categorias (IDs ou Nomes)
    const conditions: any[] = [];

    if (tipoEquipamentoIds) {
      const idsList = tipoEquipamentoIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (idsList.length > 0) {
        conditions.push({ tipoEquipamentoId: { in: idsList } });
      }
    }

    if (tipos) {
      const tiposList = tipos
        .split(',')
        .map((t) => t.trim().toUpperCase())
        .filter(Boolean);
      if (tiposList.length > 0) {
        conditions.push({
          tipoEquipamento: {
            nome: { in: tiposList, mode: 'insensitive' },
          },
        });
      }
    }

    if (conditions.length > 0) {
      where.OR = conditions;
    }

    if (condicao) {
      where.condicao = condicao;
    }

    if (statusOperacional) {
      where.statusOperacional = statusOperacional;
    }

    if (search) {
      const searchTerm = search.trim();
      where.AND = [
        {
          OR: [
            { patrimonio: { contains: searchTerm, mode: 'insensitive' } },
            { numeroSerie: { contains: searchTerm, mode: 'insensitive' } },
            { marca: { contains: searchTerm, mode: 'insensitive' } },
            { modelo: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.equipamento.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          tipoEquipamento: true,
          escolaAtual: true,
          proprietario: true,
        },
      }),
      this.prisma.equipamento.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: items as unknown as EquipamentoDto[],
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findAllTipos(): Promise<TipoEquipamentoDto[]> {
    const tipos = await this.prisma.tipoEquipamento.findMany({
      orderBy: { nome: 'asc' },
    });
    return tipos as unknown as TipoEquipamentoDto[];
  }

  async findByQrCode(qrCode: string, user: UserPayload): Promise<EquipamentoDto> {
    const equipamento = await this.prisma.equipamento.findUnique({
      where: { qrCode },
      include: {
        tipoEquipamento: true,
        escolaAtual: true,
        proprietario: true,
      },
    });

    if (!equipamento || !equipamento.ativo) {
      throw AppException.notFound('Equipamento não encontrado com o QR Code informado.');
    }

    const isSeduc =
      user.cargo === 'GESTOR_SEDUC' ||
      user.cargo === 'ADMINISTRADOR_SEDUC' ||
      user.role === 'admin';
    if (!isSeduc && user.escolaId && equipamento.escolaAtualId !== user.escolaId) {
      throw AppException.forbidden(
        'Você não possui permissão para visualizar equipamentos de outra escola.',
      );
    }

    return equipamento as unknown as EquipamentoDto;
  }

  async findById(id: string, user: UserPayload): Promise<any> {
    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id },
      include: {
        tipoEquipamento: true,
        escolaAtual: true,
        proprietario: true,
        fotos: true,
        historico: {
          orderBy: { dataEvento: 'desc' },
          include: {
            usuario: {
              select: { id: true, name: true, email: true, cargo: true },
            },
          },
        },
      },
    });

    if (!equipamento || !equipamento.ativo) {
      throw AppException.notFound('Equipamento não encontrado.');
    }

    const isSeduc =
      user.cargo === 'GESTOR_SEDUC' ||
      user.cargo === 'ADMINISTRADOR_SEDUC' ||
      user.role === 'admin';
    if (!isSeduc && user.escolaId && equipamento.escolaAtualId !== user.escolaId) {
      throw AppException.forbidden('Você não possui permissão para acessar este equipamento.');
    }

    return equipamento;
  }
}
