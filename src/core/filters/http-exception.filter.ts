import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import type { ZodError, ZodIssue } from 'zod';
import { AppException } from '../../common/exceptions/app.exception';

interface IExceptionLogger {
  error(message: unknown, ...optionalParams: unknown[]): void;
  warn(message: unknown, ...optionalParams: unknown[]): void;
}

interface IFilterRequest extends Request {
  route: Request['route'] & {
    path?: string | string[];
  };
}

const SENSITIVE_VALIDATION_FIELDS = new Set([
  'authorization',
  'cookie',
  'cookies',
  'email',
  'ip',
  'password',
  'secret',
  'token',
]);

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: IExceptionLogger = new Logger(HttpExceptionFilter.name)) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<IFilterRequest>();

    if (exception instanceof ZodValidationException) {
      const zodError = exception.getZodError() as ZodError;
      this.logHandledException({
        request,
        statusCode: HttpStatus.BAD_REQUEST,
        errorType: 'ZodValidationException',
        errorCode: 'VALIDATION_ERROR',
        message: 'validation failed',
        validationIssueCount: zodError.issues.length,
        validationFields: this.getSafeValidationFields(zodError.issues),
      });
      const errors = zodError.issues.map((issue) => ({
        type: 'validation',
        message: issue.message,
        field: issue.path.join('.'),
      }));
      return response.status(HttpStatus.BAD_REQUEST).json({
        errors,
        error_code: 'VALIDATION_ERROR',
      });
    }

    if (exception instanceof AppException) {
      this.logHandledException({
        request,
        statusCode: exception.statusCode,
        errorType: 'AppException',
        errorCode: exception.errorCode,
        message: exception.message,
      });
      return response.status(exception.statusCode).json({
        error: {
          type: 'business_logic',
          message: exception.message,
          error_code: exception.errorCode,
        },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();

      let message = 'Erro interno no servidor';
      let errorCode: string | undefined;

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        const resp = errorResponse as Record<string, unknown>;
        message = this.getSafeResponseMessage(resp.message) ?? message;
        errorCode = resp.error_code as string | undefined;
      }

      this.logHandledException({
        request,
        statusCode: status,
        errorType: exception.constructor.name,
        errorCode,
        message,
      });

      const errorBody: Record<string, unknown> = {
        error: {
          type: 'business_logic',
          message,
        },
      };

      if (errorCode) {
        (errorBody.error as Record<string, unknown>).error_code = errorCode;
      }

      return response.status(status).json(errorBody);
    }

    this.logger.error(
      {
        event: 'http.exception',
        error_type: this.getErrorType(exception),
        route_template: this.getRouteTemplate(request),
        status_family: '5xx',
        status_code: HttpStatus.INTERNAL_SERVER_ERROR,
        http_method: this.normalizeMethod(request.method),
        message: exception instanceof Error ? exception.message : 'unknown exception',
      },
      HttpExceptionFilter.name,
    );

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        type: 'unknown',
        message: 'Ocorreu um erro inesperado.',
      },
    });
  }

  private getSafeValidationFields(issues: ZodIssue[]) {
    return [
      ...new Set(
        issues
          .map((issue) => this.sanitizeIssuePath(issue))
          .filter((field): field is string => Boolean(field)),
      ),
    ];
  }

  private sanitizeIssuePath(issue: ZodIssue) {
    if (issue.path.length === 0) return 'root';

    const segments = issue.path
      .filter(
        (segment): segment is string | number =>
          typeof segment === 'string' || typeof segment === 'number',
      )
      .map((segment) => {
        if (typeof segment === 'number') return '*';
        return segment.trim();
      })
      .filter((segment) => segment.length > 0);

    if (segments.length === 0) return 'root';
    if (
      segments.some(
        (segment) =>
          typeof segment === 'string' && SENSITIVE_VALIDATION_FIELDS.has(segment.toLowerCase()),
      )
    ) {
      return null;
    }

    return segments.join('.');
  }

  private logHandledException(params: {
    request: IFilterRequest;
    statusCode: number;
    errorType: string;
    errorCode?: string;
    message: string;
    validationIssueCount?: number;
    validationFields?: string[];
  }) {
    this.logger.warn(
      {
        event: 'http.exception',
        error_type: params.errorType,
        error_code: params.errorCode,
        route_template: this.getRouteTemplate(params.request),
        status_family: this.getStatusFamily(params.statusCode),
        status_code: params.statusCode,
        http_method: this.normalizeMethod(params.request.method),
        message: params.message,
        validation_issue_count: params.validationIssueCount,
        validation_fields: params.validationFields,
      },
      HttpExceptionFilter.name,
    );
  }

  private getSafeResponseMessage(message: unknown) {
    if (typeof message === 'string') return message;
    if (Array.isArray(message))
      return message.filter((item) => typeof item === 'string').join('; ');
    return undefined;
  }

  private getRouteTemplate(request: IFilterRequest) {
    const routePath = request.route?.path;
    const path = Array.isArray(routePath) ? routePath[0] : routePath;
    if (!path || path === '*') return 'unknown';
    return path.startsWith('/') ? path : `/${path}`;
  }

  private getStatusFamily(statusCode: number) {
    if (!Number.isInteger(statusCode) || statusCode < 100 || statusCode > 599) return 'unknown';
    return `${Math.floor(statusCode / 100)}xx`;
  }

  private normalizeMethod(method: string | undefined) {
    return method ? method.toUpperCase() : 'UNKNOWN';
  }

  private getErrorType(exception: unknown) {
    if (exception instanceof Error) return exception.constructor.name;
    return 'UnknownError';
  }
}
