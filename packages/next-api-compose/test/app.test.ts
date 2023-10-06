import { createServer } from 'http'
import request from 'supertest'
import { compose } from '../src/app'
import type { IncomingMessage } from 'http'

class MockedResponse {
  status: number = 200
  body: any = null
  headers: { [key: string]: string } = {}

  constructor(body?: any, status: number = 200) {
    this.body = body
    this.status = status
  }
}

type HandlerFunction = (req: IncomingMessage) => Promise<MockedResponse>

function createTestServer(handler: HandlerFunction) {
  return createServer(async (req, res) => {
    const response: MockedResponse = await handler(req)

    res.writeHead(response.status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response.body))
  })
}

describe('composed Route Handler', () => {
  it('should correctly execute and return the response when no middleware is provided', async () => {
    const { GET } = compose({
      GET: [
        [],
        () => {
          return new MockedResponse({ foo: 'bar' })
        }
      ]
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('bar')
  })

  it('should correctly execute middlewares in the order they are provided', async () => {
    function setFooMiddleware(request) {
      request.foo = 'foo'
    }

    function appendBarToFooMiddleware(request) {
      request.foo += 'bar'
    }
    const { GET } = compose({
      GET: [
        [setFooMiddleware, appendBarToFooMiddleware],
        (request) => {
          return new MockedResponse({ foo: request.foo })
        }
      ]
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('foobar')
  })

  it('should wait for asynchronous middlewares to resolve before moving to the next middleware or handler', async () => {
    async function setFooAsyncMiddleware(request) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      request.foo = 'foo'
    }

    function appendBarToFooMiddleware(request) {
      request.foo += 'bar'
    }
    const { GET } = compose({
      GET: [
        [setFooAsyncMiddleware, appendBarToFooMiddleware],
        (request) => {
          return new MockedResponse({ foo: request.foo })
        }
      ]
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('foobar')
  })
})
