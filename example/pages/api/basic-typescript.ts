import type { NextApiRequest, NextApiResponse } from 'next'
import type { ExtendedNextApiHandler } from 'next-api-compose'
import { compose } from 'next-api-compose'

type NextApiRequestWithFoo = NextApiRequest & Partial<{ foo: string }>
type NextApiRequestWithBar = NextApiRequest & Partial<{ bar: string }>

type NextApiRequestWithFooBarHello = NextApiRequestWithFoo & NextApiRequestWithBar

export default compose<NextApiRequestWithFooBarHello>(
  [withFoo, withBar],
  (request, response) => {
    const { foo, bar } = request
    response.status(200).json({ foo, bar })
  }
)

function withFoo(handler: ExtendedNextApiHandler<NextApiRequestWithFoo>) {
  return async function (request: NextApiRequestWithFoo, response: NextApiResponse) {
    console.log('withFoo [basic-typescript]')
    request.foo = 'foo'
    return handler(request, response)
  }
}

function withBar(handler: ExtendedNextApiHandler<NextApiRequestWithBar>) {
  return async function (request: NextApiRequestWithBar, response: NextApiResponse) {
    console.log('withBar [basic-typescript]')
    request.bar = 'bar'
    return handler(request, response)
  }
}
