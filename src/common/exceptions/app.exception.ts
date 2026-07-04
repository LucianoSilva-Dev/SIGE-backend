import { type HttpException, HttpStatus } from '@nestjs/common';

export type AppErrorCode =
  | 'EMAIL_NOT_VERIFIED'
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'RESOURCE_NOT_FOUND'
  | 'DUPLICATE_ENTRY'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export interface IAppExceptionResponse {
  statusCode: number;
  message: string;
  error_code: string;
}

export class AppException extends Error {
  public readonly statusCode: number;
  public readonly errorCode: AppErrorCode;

  constructor(statusCode: number, errorCode: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppException';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }

  static emailNotVerified(message?: string): AppException {
    return new AppException(
      HttpStatus.FORBIDDEN,
      'EMAIL_NOT_VERIFIED',
      message ?? 'E-mail não verificado. Por favor, verifique seu e-mail antes de continuar.',
    );
  }

  static invalidCredentials(message?: string): AppException {
    return new AppException(
      HttpStatus.UNAUTHORIZED,
      'INVALID_CREDENTIALS',
      message ?? 'E-mail ou senha inválidos.',
    );
  }

  static notFound(message?: string): AppException {
    return new AppException(
      HttpStatus.NOT_FOUND,
      'RESOURCE_NOT_FOUND',
      message ?? 'Recurso não encontrado.',
    );
  }

  static forbidden(message?: string): AppException {
    return new AppException(HttpStatus.FORBIDDEN, 'FORBIDDEN', message ?? 'Acesso negado.');
  }

  toHttp(): IAppExceptionResponse {
    return {
      statusCode: this.statusCode,
      message: this.message,
      error_code: this.errorCode,
    };
  }
}

export function isAppException(exception: unknown): exception is AppException {
  return exception instanceof AppException;
}

export function hasErrorCode(
  exception: HttpException,
): { errorCode: string; message: string } | null {
  const response = exception.getResponse();
  if (typeof response === 'object' && response !== null && 'error_code' in response) {
    return {
      errorCode: (response as Record<string, unknown>).error_code as string,
      message: ((response as Record<string, unknown>).message as string) ?? exception.message,
    };
  }
  return null;
}
