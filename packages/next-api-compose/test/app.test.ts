import { createServer } from 'http'
import request from 'supertest'
import { it, describe, expect } from '@jest/globals'
import type { NextRequest } from 'next/server'

import { A, O } from 'ts-toolbelt'
import type { IncomingMessage } from 'http'

import { compose } from '../src/app'

class MockedResponse {
  body: any = null
  status: number = 200
  headers: { [key: string]: string } = {}

  constructor(body?: any, status: number = 200) {
    this.body = body
    this.status = status
  }
}

Object.setPrototypeOf(MockedResponse.prototype, Response.prototype)

type HandlerFunction = (req: IncomingMessage) => Promise<MockedResponse>

function createTestServer(handler: HandlerFunction) {
  return createServer(async (req, res) => {
    const response: MockedResponse = await handler(req)

    res.writeHead(response.status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(response.body))
  })
}

describe("composed route handler's http functionality", () => {
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

  it('should correctly execute handler without middleware chain provided', async () => {
    const { GET } = compose({
      GET: (request) => {
        return new MockedResponse({ foo: 'bar' }) as any
      }
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('bar')
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

  it('should abort further middleware execution and return the response if a middleware returns a Response instance.', async () => {
    function abortMiddleware(request) {
      request.foo = 'bar'
      return new MockedResponse({ foo: request.foo }, 418)
    }

    function setFooMiddleware(request) {
      request.foo = 'foo'
    }

    const { GET } = compose({
      GET: [
        [abortMiddleware, setFooMiddleware],
        () => {
          return new MockedResponse({ foo: 'unreachable fizz' })
        }
      ]
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(418)
    expect(response.body.foo).toBe('bar')
  })
})

describe("composed route handler's code features", () => {
  it("should correctly return multiple method handlers when they're composed", async () => {
    const composedMethods = compose({
      GET: (request) => {
        return new MockedResponse({ foo: 'bar' }) as any
      },
      POST: (request) => {
        return new MockedResponse({ fizz: 'buzz' }) as any
      }
    })

    expect(composedMethods).toHaveProperty("GET")
    expect(composedMethods).toHaveProperty("POST")
  })
})

// It simply won't compile if there is an error in the inference, no need for runtime assertions
describe('type inference', () => {
  it("should correctly infer final handler's intercepted request object's types", async () => {
    function someMiddleware(request: NextRequest & { foo?: string }) {
      request.foo = 'bar'
    }

    compose({
      GET: [
        [someMiddleware],
        (request) => {
          type HandlerRequestType = typeof request
          type ExpectedRequestType = NextRequest & { foo?: string }
          type IsExactType = A.Equals<HandlerRequestType, ExpectedRequestType>

          const assertIsExactType: IsExactType = 1

          type HasFooProperty = O.Has<HandlerRequestType, 'foo', string>
          const assertHasFooProperty: HasFooProperty = 1

          return new Response(request.foo)
        }
      ]
    })
  })
})
