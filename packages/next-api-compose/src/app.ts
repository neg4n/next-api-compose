import type { Promisable } from 'type-fest'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { NextResponse } from 'next/server'

type ParamType<T> = T extends (...args: [infer P]) => any ? P : never

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

type NextApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

type NextApiMethodHandler = (
  request: NextApiRequest
) => Promisable<NextApiResponse> | Promisable<Response>

type ComposeParameters<
  Methods extends NextApiRouteMethod,
  MiddlewareChain extends Array<
    (
      request: any
    ) =>
      | Promisable<NextResponse | undefined>
      | Promisable<Response | undefined>
      | Promisable<void | undefined>
  >
> = Record<
  Methods,
  | NextApiMethodHandler
  | [
      MiddlewareChain,
      (request: UnionToIntersection<ParamType<MiddlewareChain[number]>>) => any
    ]
>

/**
 * Function that allows to define complex API structure in Next.js App router's Route Handlers.
 *
 * @param {ComposeParameters} parameters Middlewares array **(order matters)** or options object with previously mentioned middlewares array as `middlewareChain` property and error handler shared by every middleware in the array as `sharedErrorHandler` property.
 * @returns Method handlers with applied middleware.
 */
export function compose<
  UsedMethods extends NextApiRouteMethod,
  MiddlewareChain extends Array<
    (
      request: any
    ) =>
      | Promisable<NextResponse | undefined>
      | Promisable<Response | undefined>
      | Promisable<void | undefined>
  >
>(parameters: ComposeParameters<UsedMethods, MiddlewareChain>) {
  const modified = Object.entries(parameters).map(
    ([method, composeForMethodData]: [
      UsedMethods,
      (
        | NextApiMethodHandler
        | [
            [(request: any) => any],
            (request: UnionToIntersection<ParamType<MiddlewareChain>>) => any
          ]
      )
    ]) => ({
      [method]: async (request: any) => {
        if (typeof composeForMethodData === 'function') {
          const handler = composeForMethodData
          return await handler(request)
        }

        const [middlewareChain, handler] = composeForMethodData

        for (const middleware of middlewareChain) {
          const abortedMiddleware = await middleware(request)

          if (abortedMiddleware != null && abortedMiddleware instanceof Response)
            return abortedMiddleware
        }

        return await handler(request)
      }
    })
  )

  return modified.reduce<Record<UsedMethods, any>>(
    (acc, obj) => ({ ...acc, ...obj }),
    {} as Record<UsedMethods, any>
  )
}
