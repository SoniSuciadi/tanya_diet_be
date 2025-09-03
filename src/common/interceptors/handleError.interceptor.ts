import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

// ErrorResponse interface yang lebih ketat
export interface ErrorResponse {
  name: string;
  message: string;
  statusCode: number;
  code?: string;
  table?: string;
  column?: string;
  detail?: string;
  query?: string;
  constraint?: string;
}

@Catch(HttpException)
export class HandleHttpError implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus(); // Get the HTTP status code
    const message = exception.message;

    const resError: ErrorResponse = {
      name: exception.constructor.name,
      message: message,
      statusCode: status,
    };

    // Customize the error response
    if (exception instanceof HttpException) {
      const responseObj = exception.getResponse();
      if (typeof responseObj === 'object') {
        resError.detail = responseObj['message'] || responseObj['detail'];
      }
    }

    response.status(resError.statusCode).json(resError);
  }
}

@Catch()
export class HandleGeneralError implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Default error response for unexpected errors
    const resError: ErrorResponse = {
      name: 'InternalServerError',
      message: 'Something went wrong!',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    // Handle known errors
    if (exception instanceof Error) {
      resError.message = exception.message;
    }

    response.status(resError.statusCode).json(resError);
  }
}
