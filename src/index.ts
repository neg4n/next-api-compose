import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'

export type NextApiComposeMiddlewares = Array<(handler: NextApiHandler) => NextApiHandler>

export type NextApiComposeOptions = {
  sharedErrorHandler: (
    error: Error,
    request: NextApiRequest,
    response: NextApiResponse
  ) => void | Promise<void>
  middlewareChain: NextApiComposeMiddlewares
}

/**
 * Higher order function that composes multiple middlewares into one API Handler.
 *
 * @param {NextApiComposeMiddlewares | NextApiComposeOptions} middlewareOrOptions Middlewares array **(order matters)** or options object with previously mentioned middlewares array as `chain` property and error handler shared by every middleware in the array as `sharedErrorHandler` property.
 * @param {NextApiHandler} handler Next.js API handler
 * @returns Middleware composed with Next.js API handler
 */
export function compose(
  middlewareOrOptions: NextApiComposeMiddlewares | NextApiComposeOptions,
  handler: NextApiHandler
) {
  const isOptions = !Array.isArray(middlewareOrOptions)
  const chain = isOptions ? middlewareOrOptions.middlewareChain : middlewareOrOptions

  return async (request: NextApiRequest, response: NextApiResponse) => {
    if (chain.length === 0) {
      return handler(request, response)
    }

    return chain.reduceRight((previousMiddleware, currentMiddleware) => {
      return async (request, response) => {
        try {
          await currentMiddleware(previousMiddleware)(request, response)
        } catch (error) {
          if (isOptions && middlewareOrOptions.sharedErrorHandler) {
            await middlewareOrOptions.sharedErrorHandler(error, request, response)
          }
        }
      }
    }, handler)(request, response)
  }
}
