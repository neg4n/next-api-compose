import { compose } from 'next-api-compose'
import { z } from 'zod'

import { validation } from '@/middleware/with-validation'
import { hello } from '@/middleware/with-hello'

const schema = z
  .object({
    foo: z.string(),
    bar: z.string().default('bar')
  })
  .strict()

const { GET, POST } = compose({
  GET: async () => {
    return new Response('haha')
  },
  POST: [
    [validation<typeof schema>('body', schema), hello],
    async (request /* Correctly inferred 🚀 */) => {
      const { foo, bar } = request.validData
      return new Response(`${request.hello} ${foo}${bar}`)
    }
  ]
})

export { GET, POST }
