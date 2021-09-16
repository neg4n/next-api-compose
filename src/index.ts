import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'
import type { IncomingMessage, OutgoingMessage } from 'http'

export type ExtendableNextApiRequest<T> = T extends NextApiRequest ? T : NextApiRequest

export type ExtendedNextApiHandler<T, H = any> = (
  request: ExtendableNextApiRequest<T>,
  response: NextApiResponse<H>
) => void | Promise<void>

export type NextApiComposeMiddlewares<T> = Array<
  (handler: ExtendedNextApiHandler<T>) => ExtendedNextApiHandler<T>
>

export type NextApiComposeOptions<T> = {
  sharedErrorHandler: (
    error: Error,
    request: NextApiRequest,
    response: NextApiResponse
  ) => void | Promise<void>
  middlewareChain: NextApiComposeMiddlewares<T>
}

export type ConnectExpressMiddleware = (
  request: IncomingMessage,
  response: OutgoingMessage,
  next: () => void
) => void | Promise<void>

/**
 * Higher order function that composes multiple middlewares into one API Handler.
 *
 * @param {NextApiComposeMiddlewares | NextApiComposeOptions} middlewareOrOptions Middlewares array **(order matters)** or options object with previously mentioned middlewares array as `middlewareChain` property and error handler shared by every middleware in the array as `sharedErrorHandler` property.
 * @param {NextApiHandler} handler Next.js API handler.
 * @returns Middleware composed with Next.js API handler.
 */
export function compose<T>(
  middlewareOrOptions: NextApiComposeMiddlewares<T> | NextApiComposeOptions<T>,
  handler: (
    request: ExtendableNextApiRequest<T>,
    response: NextApiResponse
  ) => void | Promise<void>
) {
  const isOptions = !Array.isArray(middlewareOrOptions)
  const chain = isOptions ? middlewareOrOptions.middlewareChain : middlewareOrOptions

  return async (request: ExtendableNextApiRequest<T>, response: NextApiResponse) => {
    if (chain.length === 0) {
      return handler(request, response)
    }

    return chain.reduceRight<ExtendedNextApiHandler<T>>(
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
export function convert(middleware: ConnectExpressMiddleware) {
  return function (handler: NextApiHandler) {
    return async (request: NextApiRequest, response: NextApiResponse) => {
      await middleware(request, response, () => handler(request, response))
    }
  }
}
