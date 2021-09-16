import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'
import type { IncomingMessage, OutgoingMessage, ServerResponse } from 'http'

export type ExtendableNextApiRequest<T> = T extends NextApiRequest ? T : NextApiRequest
export type ExtendableNextApiResponse<T, DataType = any> = T extends NextApiResponse
  ? T
  : NextApiResponse<DataType>

export type ExtendedNextApiHandler<
  RequestType,
  ResponseType = NextApiResponse,
  DataType = any
> = (
  request: ExtendableNextApiRequest<RequestType>,
  response: ExtendableNextApiResponse<ResponseType, DataType>
) => void | Promise<void>

export type NextApiComposeMiddlewares<
  RequestType,
  ResponseType = NextApiResponse,
  DataType = any
> = Array<
  (
    handler: ExtendedNextApiHandler<RequestType, ResponseType, DataType>
  ) => ExtendedNextApiHandler<RequestType, ResponseType, DataType>
>

export type NextApiComposeOptions<
  RequestType,
  ResponseType = NextApiResponse,
  DataType = any
> = {
  sharedErrorHandler: (
    error: Error,
    request: NextApiRequest,
    response: NextApiResponse
  ) => void | Promise<void>
  middlewareChain: NextApiComposeMiddlewares<RequestType, ResponseType, DataType>
}

export type ConnectExpressMiddleware = (
  request: IncomingMessage,
  response: OutgoingMessage | ServerResponse,
  next: (error?: Error) => void
) => void | Promise<void>

/**
 * Higher order function that composes multiple middlewares into one API Handler.
 *
 * @param {NextApiComposeMiddlewares | NextApiComposeOptions} middlewareOrOptions Middlewares array **(order matters)** or options object with previously mentioned middlewares array as `middlewareChain` property and error handler shared by every middleware in the array as `sharedErrorHandler` property.
 * @param {NextApiHandler} handler Next.js API handler.
 * @returns Middleware composed with Next.js API handler.
 */
export function compose<RequestType, ResponseType = NextApiResponse, DataType = any>(
  middlewareOrOptions:
    | NextApiComposeMiddlewares<RequestType, ResponseType>
    | NextApiComposeOptions<RequestType, ResponseType>,
  handler: (
    request: ExtendableNextApiRequest<RequestType>,
    response: ExtendableNextApiResponse<ResponseType, DataType>
  ) => void | Promise<void>
) {
  const isOptions = !Array.isArray(middlewareOrOptions)
  const chain = isOptions ? middlewareOrOptions.middlewareChain : middlewareOrOptions

  return async (
    request: ExtendableNextApiRequest<RequestType>,
    response: ExtendableNextApiResponse<ResponseType, DataType>
  ) => {
    if (chain.length === 0) {
      return handler(request, response)
    }

    return chain.reduceRight<ExtendedNextApiHandler<RequestType, ResponseType, DataType>>(
      (previousMiddleware, currentMiddleware) => {
        return async (request, response) => {
          try {
            await currentMiddleware(previousMiddleware)(request, response)
          } catch (error) {
            if (isOptions && middlewareOrOptions.sharedErrorHandler) {
              await middlewareOrOptions.sharedErrorHandler(error, request, response)
            }
          }
        }
      },
      handler
    )(request, response)
  }
}

/**
 * Higher order function that converts [Connect]/[Express] middleware into middleware compatible with `next-api-compose`.
 *
 * @param {ConnectExpressMiddleware} middleware [Connect]/[Express] middleware to convert.
 * @returns Middleware compatible with `next-api-compose`.
 *
 * [connect]: https://github.com/senchalabs/connect
 * [express]: https://expressjs.com
 */
export function convert<RequestType, ResponseType = NextApiResponse, DataType = any>(
  middleware: ConnectExpressMiddleware
) {
  return function (handler: ExtendedNextApiHandler<RequestType, ResponseType, DataType>) {
    return async (
      request: ExtendableNextApiRequest<RequestType>,
      response: ExtendableNextApiResponse<ResponseType, DataType>
    ) => {
      await middleware(request, response, () => handler(request, response))
    }
  }
}
