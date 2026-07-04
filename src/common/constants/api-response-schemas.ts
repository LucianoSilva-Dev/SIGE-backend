import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const validationErrorSchema: SchemaObject & Partial<ReferenceObject> = {
  type: 'object',
  properties: {
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['validation'] },
          message: { type: 'string', example: 'O campo nome é obrigatório' },
          field: {
            type: 'string',
            example: 'lessons.0.lessonName || lessonName, etc...',
            description: 'Caminho até o campo com erro (separado por .)',
          },
        },
      },
    },
    error_code: {
      type: 'string',
      example: 'VALIDATION_ERROR',
      description: 'Código de erro estruturado para interpretação programática',
    },
  },
};

export const businessLogicErrorSchema: SchemaObject & Partial<ReferenceObject> = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['business_logic'] },
        message: {
          type: 'string',
          example: 'Você precisa ser admin para acessar essa rota',
        },
        error_code: {
          type: 'string',
          example: 'FORBIDDEN',
          description: 'Código de erro estruturado para interpretação programática',
        },
      },
    },
  },
};

export const unknownErrorSchema: SchemaObject & Partial<ReferenceObject> = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['unknown'] },
        message: { type: 'string', example: 'Internal Server Error' },
      },
    },
  },
};
