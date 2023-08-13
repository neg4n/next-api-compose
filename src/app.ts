import type { Promisable, RequireAtLeastOne } from 'type-fest'
import { Any, List, O } from 'ts-toolbelt'
import type { NextApiRequest, NextApiResponse } from 'next'

type NextApiRouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

type NextApiRouteHandlerResponse = Promisable<NextApiResponse> | Promisable<Response>

type NextApiRouteMethodHandler = (request: NextApiRequest) => NextApiRouteHandlerResponse

type NextApiRouteMiddleware<Intercepted> = (
  request: Intercepted extends NextApiRequest ? Intercepted : NextApiRequest
) => Promisable<void> | NextApiRouteHandlerResponse

type ExtractMiddlewareInterceptedRequest<Type> = Type extends NextApiRouteMiddleware<
  infer X
>[]
  ? X[]
  : Type extends NextApiRouteMiddleware<infer X>
  ? X
  : never

export type ComposeParameters<
  Methods extends NextApiRouteMethod,
  InterceptedMiddleware extends NextApiRequest,
  FinalRouteInterceptionResult 
> = Record<
  Methods,
  | NextApiRouteMethodHandler
  | [
      NextApiRouteMiddleware<InterceptedMiddleware>[],
      (request: FinalRouteInterceptionResult) => NextApiRouteHandlerResponse
    ]
>

export async function compose<
  UsedMethods extends NextApiRouteMethod,
  InterceptedMiddleware extends NextApiRequest,
  FinalRouteInterceptionResult = O.MergeAll<NextApiRequest, InterceptedMiddleware[]>
>(
  parameters: ComposeParameters<
    UsedMethods,
    InterceptedMiddleware,
    FinalRouteInterceptionResult extends NextApiRequest
      ? FinalRouteInterceptionResult
      : NextApiRequest
  >
) {
  const modified = await Promise.all(
    Object.entries(parameters).map(async ([rawMethod, rawComposeForMethodData]) => ({
      [rawMethod as UsedMethods]: async (request: any) => {
        const composeForMethodData = rawComposeForMethodData as
          | NextApiRouteMethodHandler
          | [
              NextApiRouteMiddleware<InterceptedMiddleware>[],
              (request: FinalRouteInterceptionResult) => NextApiRouteHandlerResponse
            ]

        if (Array.isArray(composeForMethodData)) {
          const [middlewareChain, handler] = composeForMethodData

          for (const middleware of middlewareChain) {
            const abortedMiddleware = await middleware(request)

            if (abortedMiddleware != null && abortedMiddleware instanceof Response)
              return abortedMiddleware
          }

          return await handler(request as any)
        }

        const singleHandler = composeForMethodData
        await singleHandler(request)
      }
    }))
  )

  return modified.reduce<Record<UsedMethods, NextApiRouteMethodHandler>>(
    (acc, obj) => ({ ...acc, ...obj }),
    {} as Record<UsedMethods, NextApiRouteMethodHandler>
  )
}

async function m() {
  const handlers = await compose({
    GET: (request) => {
      return new Response()
    },
    POST: [
      [
        (request: NextApiRequest & { foo: string }) => {
          //@ts-ignore
          request.foo = 'bar'
          return new Response('siema')
        }
      ],
      (request) => {
        request.foo
        console.log(request)
        return new Response()
      }
    ]
  })
}
m()
