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

@Injectable()
export class EquipamentosService {
  constructor(private readonly prisma: PrismaService) {}

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
