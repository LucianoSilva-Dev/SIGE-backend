import { UserPayload } from '@common/decorators/current-user.decorator';
import { AppException } from '@common/exceptions/app.exception';
import { ConfigService } from '@config/index';
import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CreateInspecaoDto } from './dto/create-inspecao.dto';

@Injectable()
export class InspecoesService {
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

  async create(dto: CreateInspecaoDto, user: UserPayload, files?: Express.Multer.File[]) {
    const equipamento = await this.prisma.equipamento.findUnique({
      where: { id: dto.equipamentoId },
      include: { escolaAtual: true },
    });

    if (!equipamento || !equipamento.ativo) {
      throw AppException.notFound('Equipamento não encontrado ou inativo.');
    }

    if (!this.isSeduc(user) && user.escolaId && equipamento.escolaAtualId !== user.escolaId) {
      throw AppException.forbidden(
        'Você não tem permissão para realizar inspeções em equipamentos de outra escola.',
      );
    }

    const hasFiles = files && files.length > 0;

    // Regra do Usuário: Para ser gerado um chamado corretivo a partir da inspeção,
    // a condição física deve ser RUIM ou INUTILIZADO.
    if (dto.gerarChamado || hasFiles) {
      const condicaoValida =
        dto.condicaoEncontrada === 'RUIM' || dto.condicaoEncontrada === 'INUTILIZADO';
      if (!condicaoValida) {
        throw AppException.badRequest(
          'Um chamado corretivo e o upload de fotos só podem ser realizados caso a condição do equipamento seja RUIM ou INUTILIZADO.',
          'INVALID_TICKET_CONDITION',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Criar a Inspeção
      const inspecao = await tx.inspecao.create({
        data: {
          equipamentoId: dto.equipamentoId,
          usuarioId: user.id,
          condicaoEncontrada: dto.condicaoEncontrada,
          observacoes: dto.observacoes,
          aprovadoDiretor: false,
        },
      });

      // 2. Atualizar estado do Equipamento
      const updateData: any = {
        condicao: dto.condicaoEncontrada,
      };

      if (dto.statusOperacional) {
        updateData.statusOperacional = dto.statusOperacional;
      } else if (dto.condicaoEncontrada === 'INUTILIZADO') {
        updateData.statusOperacional = 'INOPERANTE';
      } else if (dto.condicaoEncontrada === 'RUIM') {
        updateData.statusOperacional = 'AGUARDANDO_REPARO';
      }

      await tx.equipamento.update({
        where: { id: dto.equipamentoId },
        data: updateData,
      });

      // 3. Criar Chamado Corretivo se solicitado ou se houver evidências enviadas
      let chamadoCriado = null;
      if (dto.gerarChamado || hasFiles) {
        const descricaoChamado =
          dto.descricaoChamado?.trim() ||
          dto.observacoes?.trim() ||
          `Chamado gerado automaticamente na inspeção. Condição: ${dto.condicaoEncontrada}.`;

        chamadoCriado = await tx.chamadoCorretivo.create({
          data: {
            equipamentoId: dto.equipamentoId,
            abertoPorId: user.id,
            inspecaoId: inspecao.id,
            descricao: descricaoChamado,
            status: 'ABERTO',
          },
        });
      }

      // 4. Salvar e Vincular Evidências Fotográficas do Chamado/Inspeção
      if (hasFiles && files) {
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

          await tx.foto.create({
            data: {
              url,
              tipo: 'MANUTENCAO',
              referenciaId: inspecao.id,
              inspecaoId: inspecao.id,
              chamadoId: chamadoCriado?.id || null,
              equipamentoId: dto.equipamentoId,
              enviadoPorId: user.id,
            },
          });
        }
      }

      // 5. Histórico do Equipamento
      await tx.historicoEquipamento.create({
        data: {
          equipamentoId: dto.equipamentoId,
          usuarioId: user.id,
          tipoEvento: chamadoCriado ? 'MANUTENCAO_ABERTA' : 'STATUS_ALTERADO',
          descricao: `Inspeção realizada. Condição: ${dto.condicaoEncontrada}.${
            chamadoCriado ? ' Chamado corretivo gerado.' : ''
          }`,
        },
      });

      const result = await tx.inspecao.findUnique({
        where: { id: inspecao.id },
        include: {
          equipamento: true,
          usuario: { select: { id: true, name: true, email: true, cargo: true } },
          fotos: true,
          chamados: true,
        },
      });

      return result as any;
    });
  }

  async findAll(user: UserPayload) {
    const where: any = {};

    if (!this.isSeduc(user)) {
      if (!user.escolaId) {
        throw AppException.forbidden('Usuário não está vinculado a uma escola.');
      }
      where.equipamento = {
        escolaAtualId: user.escolaId,
      };
    }

    return this.prisma.inspecao.findMany({
      where,
      orderBy: { dataRealizacao: 'desc' },
      include: {
        equipamento: {
          include: { tipoEquipamento: true, escolaAtual: true },
        },
        usuario: { select: { id: true, name: true, email: true, cargo: true } },
        fotos: true,
        chamados: true,
      },
    });
  }

  async findById(id: string, user: UserPayload) {
    const inspecao = await this.prisma.inspecao.findUnique({
      where: { id },
      include: {
        equipamento: {
          include: { tipoEquipamento: true, escolaAtual: true },
        },
        usuario: { select: { id: true, name: true, email: true, cargo: true } },
        fotos: true,
        chamados: true,
      },
    });

    if (!inspecao) {
      throw AppException.notFound('Inspeção não encontrada.');
    }

    if (
      !this.isSeduc(user) &&
      user.escolaId &&
      inspecao.equipamento.escolaAtualId !== user.escolaId
    ) {
      throw AppException.forbidden('Você não tem permissão para acessar esta inspeção.');
    }

    return inspecao;
  }

  async aprovarDiretor(id: string, user: UserPayload) {
    if (!this.isSeduc(user) && user.cargo !== 'DIRETOR_ESCOLAR') {
      throw AppException.forbidden(
        'Apenas o diretor escolar ou a SEDUC pode aprovar o relatório de inspeção.',
      );
    }

    const inspecao = await this.prisma.inspecao.findUnique({
      where: { id },
      include: { equipamento: true },
    });

    if (!inspecao) {
      throw AppException.notFound('Inspeção não encontrada.');
    }

    if (
      !this.isSeduc(user) &&
      user.escolaId &&
      inspecao.equipamento.escolaAtualId !== user.escolaId
    ) {
      throw AppException.forbidden('Você não tem permissão para aprovar a inspeção desta escola.');
    }

    return this.prisma.inspecao.update({
      where: { id },
      data: {
        aprovadoDiretor: true,
        aprovadoEm: new Date(),
      },
      include: {
        equipamento: true,
        usuario: { select: { id: true, name: true, email: true, cargo: true } },
      },
    });
  }
}
