import { NextApiRequest } from 'next'
import { compose } from 'next-api-compose'

const { GET, POST } = compose({
  GET: async (request) => {
    return new Response('haha')
  },
  POST: [
    [
      async (request: NextApiRequest & { foo: string }) => {
        request.foo = 'bar'
      },
      (request: NextApiRequest & { bar: string }) => {
        request.bar = 'foo'
      }
    ],
    async (request /* Correctly inferred 🚀 */) => {
      return new Response(request.foo + request.bar)
    }
  ]
})

export { GET, POST }
