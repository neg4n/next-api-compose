import { IncomingMessage, ServerResponse } from 'http'
import type { NextApiRequest, NextApiResponse } from 'next'
import type {
  ConnectExpressMiddleware,
  ExtendedNextApiHandler,
  NextApiComposeMiddlewares,
  NextApiComposeOptions
} from 'next-api-compose'
import { compose, convert } from 'next-api-compose'

type NextApiRequestWithFoo = NextApiRequest & Partial<{ foo: string }>
type NextApiRequestWithBar = NextApiRequest & Partial<{ bar: string }>
type IncomingMessageWithHello = IncomingMessage & Partial<{ hello: string }>

type NextApiRequestWithFooBarHello = NextApiRequestWithFoo &
  NextApiRequestWithBar &
  IncomingMessageWithHello

const withHello = convert(helloMiddleware as ConnectExpressMiddleware)

const mws: NextApiComposeMiddlewares<NextApiRequestWithFooBarHello> = [
  withFoo,
  withBar,
  withHello
]
const options: NextApiComposeOptions<NextApiRequestWithFooBarHello> = {
  sharedErrorHandler: handleErrors,
  middlewareChain: mws
}

export default compose<NextApiRequestWithFooBarHello>(options, (request, response) => {
  console.log('API Route [advanced-typescript-complete]')
  const { foo, bar, hello } = request
  response.status(200).json({ foo, bar, hello })
})

function handleErrors(error: Error, _request: NextApiRequest, response: NextApiResponse) {
  console.log('handleErrors [advanced-typescript-complete]')
  response.status(418).json({ error: error.message })
}

function helloMiddleware(
  request: IncomingMessageWithHello,
  _response: ServerResponse,
  next: () => void
) {
  console.log('helloMiddleware (Connect/Express) [advanced-typescript-complete]')
  request.hello = 'hello'
  next()
}

function withFoo(handler: ExtendedNextApiHandler<NextApiRequestWithFoo>) {
  return async function (request: NextApiRequestWithFoo, response: NextApiResponse) {
    console.log('withFoo [advanced-typescript-complete]')
    request.foo = 'foo'
    return handler(request, response)
  }
}

function withBar(handler: ExtendedNextApiHandler<NextApiRequestWithBar>) {
  return async function (request: NextApiRequestWithBar, response: NextApiResponse) {
    console.log('withBar [advanced-typescript-complete]')
    request.bar = 'bar'
    return handler(request, response)
  }
}
