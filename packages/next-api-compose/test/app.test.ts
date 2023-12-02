import { createServer } from 'http'
import request from 'supertest'
import { it, describe, expect } from '@jest/globals'
import type { NextRequest } from 'next/server'

import { A, O } from 'ts-toolbelt'
import type { IncomingMessage } from 'http'

import { compose } from '../src/app'

type HandlerFunction = (req: IncomingMessage) => Promise<Response>

async function streamToJson<T>(stream: ReadableStream<T>) {
  const reader = stream.getReader()
  let chunks: Uint8Array[] = []

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value as any)
  }

  const string = new TextDecoder().decode(
    Uint8Array.from(chunks.flatMap((chunk) => Array.from(chunk)))
  )
  return JSON.parse(string)
}

function createTestServer(handler: HandlerFunction) {
  return createServer(async (req, res) => {
    const response = await handler(req)
    if (response.body) {
      const body = await streamToJson(response.body)
      res.writeHead(response.status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(body))
    }
  })
}

describe("composed route handler's http functionality", () => {
  it('should correctly execute and return the response when no middleware is provided', async () => {
    const { GET } = compose({
      GET: [
        [],
        () => {
          return new Response(JSON.stringify({ foo: 'bar' }))
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
          return new Response(JSON.stringify({ foo: request.foo }))
        }
      ]
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('foobar')
  })

  it("should handle errors thrown by handler when no middleware is provided and return a 500 response with the error's message", async () => {
    const { GET } = compose(
      {
        GET: () => {
          throw new Error('foo')
        }
      },
      {
        sharedErrorHandler: {
          includeRouteHandler: true,
          handler: (_method, error) => {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 })
          }
        }
      }
    )

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(500)
    expect(response.body.error).toBe('foo')
  })

  it("should handle errors thrown by middlewares and return a 500 response with the error's message", async () => {
    function errorMiddleware() {
      throw new Error('foo')
    }

    const { GET } = compose(
      {
        GET: [
          [errorMiddleware],
          () => {
            return new Response(JSON.stringify({ foo: 'bar' }))
          }
        ]
      },
      {
        sharedErrorHandler: {
          handler: (_method, error) => {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500
            })
          }
        }
      }
    )

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(500)
    expect(response.body.error).toBe('foo')
  })


  it("should abort (halt) further middleware and handler execution with no error scenario when shared error handler is provided", async () => {
    function haltingMiddleware() {
      return new Response(JSON.stringify({ foo: 'bar' })) 
    }

    const { GET } = compose(
      {
        GET: [
          [haltingMiddleware],
          () => {
            return new Response(JSON.stringify({ foo: 'bar' }))
          }
        ]
      },
      {
        sharedErrorHandler: {
          handler: (_method, error) => {
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500
            })
          }
        }
      }
    )

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('bar')
  })

  it('should correctly execute handler without middleware chain provided', async () => {
    const { GET } = compose({
      GET: (request) => {
        return new Response(JSON.stringify({ foo: 'bar' }))
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
          return new Response(JSON.stringify({ foo: request.foo }))
        }
      ]
    })

    const app = createTestServer(GET)
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body.foo).toBe('foobar')
  })

  it('should abort (halt) further middleware and handler execution and return the response if a middleware returns a Response instance.', async () => {
    function abortMiddleware(request) {
      request.foo = 'bar'
      return new Response(JSON.stringify({ foo: request.foo }), { status: 418 })
    }

    function setFooMiddleware(request) {
      request.foo = 'foo'
    }

    const { GET } = compose({
      GET: [
        [abortMiddleware, setFooMiddleware],
        () => {
          return new Response(JSON.stringify({ foo: 'unreachable fizz' }))
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
        return new Response(JSON.stringify({ foo: 'bar' }))
      },
      POST: (request) => {
        return new Response(JSON.stringify({ fizz: 'buzz' }))
      }
    })

    expect(composedMethods).toHaveProperty('GET')
    expect(composedMethods).toHaveProperty('POST')
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
