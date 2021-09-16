import { compose, convert } from 'next-api-compose'
import helmet from 'helmet'

const withHelmet = convert(helmet())

export default compose([withBar, withFoo, withHelmet], async (request, response) => {
  const { foo, bar } = request
  response.status(200).json({ foo, bar })
})

function withFoo(handler) {
  return async function (request, response) {
    console.log('withFoo [basic-express-middleware]')
    request.foo = 'foo'
    return handler(request, response)
  }
}

function withBar(handler) {
  return async function (request, response) {
    console.log('withBar [basic-express-middleware]')
    request.bar = 'bar'
    return handler(request, response)
  }
}
