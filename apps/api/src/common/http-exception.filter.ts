import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filtre global : journalise chaque erreur et renvoie un format JSON stable.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = exception instanceof HttpException ? exception.getResponse() : null;
    const message = typeof payload === 'string'
      ? payload
      : (payload as any)?.message ?? 'Erreur interne du serveur';

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} -> ${status}`, exception instanceof Error ? exception.stack : String(exception));
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${status}: ${JSON.stringify(message)}`);
    }

    res.status(status).json({
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString()
    });
  }
}
