import { compose } from 'next-api-compose'

export default compose(
  {
    sharedErrorHandler: handleErrors,
    middlewareChain: [withBar, withFoo, withThrowError]
  },
  (request, response) => {
    console.log('API Route [basic-error-handling]')
    const { foo, bar } = request
    response.status(200).json({ foo, bar })
  }
)

function handleErrors(error, _request, response) {
  console.log('handleErrors [basic-error-handling]')
  response.status(500).json({ message: error.message })
}

function withFoo(handler) {
  return async function (request, response) {
    console.log('withFoo [basic-error-handling]')
    request.foo = 'foo'
    return handler(request, response)
  }
}

function withBar(handler) {
  return async function (request, response) {
    console.log('withBar [basic-error-handling]')
    request.bar = 'bar'
    return handler(request, response)
  }
}

function withThrowError() {
  return async function () {
    console.log('withThrowError [basic-error-handling]')
    throw new Error('Thats an error. :(')
  }
}
