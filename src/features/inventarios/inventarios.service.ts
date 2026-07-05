import { UserPayload } from '@common/decorators/current-user.decorator';
import { AppException } from '@common/exceptions/app.exception';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { AddItemInventarioDto } from './dto/add-item-inventario.dto';
import { AprovarRejeitarInventarioDto } from './dto/aprovar-rejeitar-inventario.dto';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { ConfigService } from '@config/index';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class InventariosService {
  private readonly uploadDir = join(process.cwd(), 'uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private isSeduc(user: UserPayload): boolean {
    return (
      user.cargo === 'GESTOR_SEDUC' || user.cargo === 'ADMINISTRADOR_SEDUC' || user.role === 'admin'
    );
  }

  private checkSchoolScope(escolaId: string, user: UserPayload) {
    if (!this.isSeduc(user) && user.escolaId && escolaId !== user.escolaId) {
      throw AppException.forbidden(
        'Você não possui permissão para acessar os inventários desta escola.',
      );
    }
  }

  async create(dto: CreateInventarioDto, user: UserPayload) {
    const escolaId = this.isSeduc(user) ? dto.escolaId || user.escolaId : user.escolaId;

    if (!escolaId) {
      throw AppException.badRequest('O ID da escola é obrigatório para iniciar um inventário.');
    }

    const escola = await this.prisma.escola.findUnique({ where: { id: escolaId } });
    if (!escola) {
      throw AppException.notFound('Escola não encontrada.');
    }

    return this.prisma.inventario.create({
      data: {
        escolaId,
        criadoPorId: user.id,
        status: 'EM_ELABORACAO',
      },
      include: {
        escola: true,
        criadoPor: { select: { id: true, name: true, email: true, cargo: true } },
        itens: true,
      },
    });
  }

  async addItem(inventarioId: string, dto: AddItemInventarioDto, user: UserPayload, files?: Express.Multer.File[]) {
    const inventario = await this.prisma.inventario.findUnique({
      where: { id: inventarioId },
    });

    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    this.checkSchoolScope(inventario.escolaId, user);

    if (inventario.status !== 'EM_ELABORACAO' && inventario.status !== 'REJEITADO') {
      throw AppException.conflict(
        'Itens só podem ser adicionados em inventários em elaboração ou rejeitados.',
      );
    }

    const tipo = await this.prisma.tipoEquipamento.findUnique({
      where: { id: dto.tipoEquipamentoId },
    });
    if (!tipo) {
      throw AppException.notFound('Tipo de equipamento não encontrado.');
    }

    const item = await this.prisma.itemInventario.create({
      data: {
        inventarioId,
        tipoEquipamentoId: dto.tipoEquipamentoId,
        patrimonio: dto.patrimonio,
        numeroSerie: dto.numeroSerie,
        marca: dto.marca,
        modelo: dto.modelo,
        condicao: dto.condicao,
        observacoes: dto.observacoes,
      },
      include: {
        tipoEquipamento: true,
      },
    });

    if (files && files.length > 0) {
      const port = this.configService.get<number>('PORT') ?? 3000;
      const host = this.configService.get<string>('HOST') ?? 'localhost';
      const baseUrl = `http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`;

      for (const file of files) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw AppException.badRequest(
            `Formato de imagem inválido (${file.originalname}). Suportados: ${allowedMimeTypes.join(', ')}`,
            'INVALID_MIME_TYPE',
          );
        }

        const ext = file.originalname.split('.').pop() || 'webp';
        const filename = `evidence-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
        const filePath = join(this.uploadDir, filename);

        writeFileSync(filePath, file.buffer);

        const url = `${baseUrl}/public/uploads/${filename}`;

        await this.prisma.foto.create({
          data: {
            url,
            tipo: 'INVENTARIO',
            referenciaId: item.id,
            inventarioId,
            enviadoPorId: user.id,
          },
        });
      }
    }

    return item;
  }

  async findAll(user: UserPayload) {
    const where: any = {};
    if (!this.isSeduc(user)) {
      if (!user.escolaId) {
        throw AppException.forbidden('Usuário não está vinculado a uma escola.');
      }
      where.escolaId = user.escolaId;
    }

    return this.prisma.inventario.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        escola: true,
        criadoPor: { select: { id: true, name: true, email: true, cargo: true } },
        _count: { select: { itens: true } },
      },
    });
  }

  async findById(id: string, user: UserPayload) {
    const inventario = await this.prisma.inventario.findUnique({
      where: { id },
      include: {
        escola: true,
        criadoPor: { select: { id: true, name: true, email: true, cargo: true } },
        itens: {
          include: {
            tipoEquipamento: true,
          },
        },
        fotos: true,
      },
    });

    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    this.checkSchoolScope(inventario.escolaId, user);

    return inventario;
  }

  async enviarParaDiretor(id: string, user: UserPayload) {
    const inventario = await this.prisma.inventario.findUnique({
      where: { id },
      include: { _count: { select: { itens: true } } },
    });

    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    this.checkSchoolScope(inventario.escolaId, user);

    if (inventario.status !== 'EM_ELABORACAO' && inventario.status !== 'REJEITADO') {
      throw AppException.conflict(
        'Apenas inventários em elaboração ou rejeitados podem ser submetidos.',
      );
    }

    if (inventario._count.itens === 0) {
      throw AppException.badRequest(
        'O inventário deve possuir pelo menos 1 item antes de ser enviado.',
      );
    }

    return this.prisma.inventario.update({
      where: { id },
      data: {
        status: 'AGUARDANDO_APROVACAO_DIRETOR',
        enviadoDiretorEm: new Date(),
        justificativaRejeicao: null,
      },
    });
  }

  async aprovarDiretor(id: string, user: UserPayload) {
    if (!this.isSeduc(user) && user.cargo !== 'DIRETOR_ESCOLAR') {
      throw AppException.forbidden(
        'Apenas diretores escolares ou SEDUC podem realizar esta aprovação.',
      );
    }

    const inventario = await this.prisma.inventario.findUnique({ where: { id } });
    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    this.checkSchoolScope(inventario.escolaId, user);

    if (inventario.status !== 'AGUARDANDO_APROVACAO_DIRETOR') {
      throw AppException.conflict('O inventário não está aguardando aprovação do diretor.');
    }

    const now = new Date();
    return this.prisma.inventario.update({
      where: { id },
      data: {
        status: 'AGUARDANDO_APROVACAO_SEDUC',
        aprovadoDiretorEm: now,
        enviadoSeducEm: now,
      },
    });
  }

  async rejeitarDiretor(id: string, dto: AprovarRejeitarInventarioDto, user: UserPayload) {
    if (!this.isSeduc(user) && user.cargo !== 'DIRETOR_ESCOLAR') {
      throw AppException.forbidden(
        'Apenas diretores escolares ou SEDUC podem rejeitar o inventário.',
      );
    }

    if (!dto.justificativa?.trim()) {
      throw AppException.badRequest('A justificativa de rejeição é obrigatória.');
    }

    const inventario = await this.prisma.inventario.findUnique({ where: { id } });
    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    this.checkSchoolScope(inventario.escolaId, user);

    if (inventario.status !== 'AGUARDANDO_APROVACAO_DIRETOR') {
      throw AppException.conflict(
        'O inventário não está no status correto para análise do diretor.',
      );
    }

    return this.prisma.inventario.update({
      where: { id },
      data: {
        status: 'REJEITADO',
        justificativaRejeicao: dto.justificativa,
      },
    });
  }

  async verificarDuplicidades(id: string, user: UserPayload) {
    const inventario = await this.prisma.inventario.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    const duplicidades: any[] = [];

    for (const item of inventario.itens) {
      const matches: any[] = [];

      if (item.patrimonio) {
        const porPatrimonio = await this.prisma.equipamento.findMany({
          where: { patrimonio: item.patrimonio, ativo: true },
          include: { escolaAtual: true },
        });
        if (porPatrimonio.length > 0) {
          matches.push(
            ...porPatrimonio.map((m) => ({ motivo: 'Mesmo Patrimônio', equipamento: m })),
          );
        }
      }

      if (item.numeroSerie) {
        const porSerie = await this.prisma.equipamento.findMany({
          where: { numeroSerie: item.numeroSerie, ativo: true },
          include: { escolaAtual: true },
        });
        if (porSerie.length > 0) {
          matches.push(
            ...porSerie.map((m) => ({ motivo: 'Mesmo Número de Série', equipamento: m })),
          );
        }
      }

      if (matches.length > 0) {
        duplicidades.push({
          itemInventario: item,
          correspondencias: matches,
        });
      }
    }

    return {
      totalItens: inventario.itens.length,
      itensComPossivelDuplicidade: duplicidades.length,
      detalhes: duplicidades,
    };
  }

  async aprovarSeduc(id: string, user: UserPayload) {
    if (!this.isSeduc(user)) {
      throw AppException.forbidden(
        'Apenas usuários com perfil SEDUC podem realizar a aprovação final.',
      );
    }

    const inventario = await this.prisma.inventario.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    if (inventario.status !== 'AGUARDANDO_APROVACAO_SEDUC') {
      throw AppException.conflict('O inventário não está aguardando aprovação da SEDUC.');
    }

    const proprietarioDefault = await this.prisma.proprietario.findFirst({
      where: { tipo: 'PROPRIO' },
    });

    if (!proprietarioDefault) {
      throw AppException.badRequest(
        'Nenhum proprietário próprio cadastrado no sistema para vincular o equipamento.',
      );
    }

    // Processamento transacional para incorporação dos equipamentos
    return this.prisma.$transaction(async (tx) => {
      for (const item of inventario.itens) {
        const codeSuffix =
          item.patrimonio || item.numeroSerie || item.id.substring(0, 8).toUpperCase();
        const escolaCode = inventario.escolaId.substring(0, 8).toUpperCase();
        const qrCode = `SIGE-${escolaCode}-${codeSuffix}`;

        const equipamento = await tx.equipamento.create({
          data: {
            patrimonio: item.patrimonio,
            numeroSerie: item.numeroSerie,
            tipoEquipamentoId: item.tipoEquipamentoId,
            proprietarioId: proprietarioDefault.id,
            marca: item.marca,
            modelo: item.modelo,
            dataAquisicao: new Date(),
            escolaAtualId: inventario.escolaId,
            qrCode,
            statusOperacional: 'OPERANTE',
            statusCadastro: 'APROVADO',
            condicao: item.condicao,
            observacoes: item.observacoes,
            ativo: true,
          },
        });

        // Eventos de histórico auditável
        await tx.historicoEquipamento.create({
          data: {
            equipamentoId: equipamento.id,
            usuarioId: user.id,
            tipoEvento: 'CADASTRO',
            descricao: 'Equipamento incorporado a partir do inventário inicial da escola.',
          },
        });

        await tx.historicoEquipamento.create({
          data: {
            equipamentoId: equipamento.id,
            usuarioId: user.id,
            tipoEvento: 'APROVACAO',
            descricao: 'Inventário aprovado definitivamente pela SEDUC.',
          },
        });
      }

      return tx.inventario.update({
        where: { id },
        data: {
          status: 'APROVADO',
          aprovadoSeducEm: new Date(),
        },
        include: {
          escola: true,
          itens: true,
        },
      });
    });
  }

  async rejeitarSeduc(id: string, dto: AprovarRejeitarInventarioDto, user: UserPayload) {
    if (!this.isSeduc(user)) {
      throw AppException.forbidden('Apenas usuários com perfil SEDUC podem rejeitar o inventário.');
    }

    if (!dto.justificativa?.trim()) {
      throw AppException.badRequest('A justificativa de rejeição é obrigatória.');
    }

    const inventario = await this.prisma.inventario.findUnique({ where: { id } });
    if (!inventario) {
      throw AppException.notFound('Inventário não encontrado.');
    }

    if (inventario.status !== 'AGUARDANDO_APROVACAO_SEDUC') {
      throw AppException.conflict('O inventário não está aguardando aprovação da SEDUC.');
    }

    return this.prisma.inventario.update({
      where: { id },
      data: {
        status: 'REJEITADO',
        justificativaRejeicao: dto.justificativa,
      },
    });
  }
}
