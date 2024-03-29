import type { NextApiRequest, NextApiResponse } from 'next'
import { createServer } from 'http'
import request from 'supertest'
import { describe, it, expect } from '@jest/globals'

import type {
  MockedNextRequestWithFoo,
  MockedNextResponseWithBar,
  MockedNextRequestWithFizz,
  MockedNextResponseWithBuzz
} from './__stubs__/middleware'
import {
  withMockedFizzBuzz,
  withMockedFooBar,
  withThrowError,
  connectMockedFizzBuzz,
  connectMockedFooBar
} from './__stubs__/middleware'
import { compose, convert, configure } from '../src/pages'

type MockedRequestWithFooFizz = MockedNextRequestWithFoo & MockedNextRequestWithFizz
type MockedResponseWithBarBuzz = MockedNextResponseWithBar & MockedNextResponseWithBuzz

function createDummyNextServer(handler) {
  return createServer((request, response) => {
    return handler(request as NextApiRequest, response as NextApiResponse)
  })
}

describe("compose's http functionality", () => {
  it('should execute final handler if empty middleware chain is provided', async () => {
    const handler = compose([], (request, response) => {
      response.end('im empty')
    })

    const server = createDummyNextServer(handler)
    const response = await request(server).get('/')

    expect(response.text).toBe('im empty')
  })

  it('should compose 2 middleware chain and intercept its request and response objects', async () => {
    const mockedNextApiRoute = compose<
      MockedRequestWithFooFizz,
      MockedResponseWithBarBuzz
    >([withMockedFizzBuzz, withMockedFooBar], (request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ foo: request.foo, fizz: request.fizz }))
    })

    const server = createDummyNextServer(mockedNextApiRoute)
    const response = await request(server).get('/')

    expect(response.body).toStrictEqual({ foo: 'foo', fizz: 'fizz' })
  })

  it('should compose 2 middleware chain from options object and intercept its request and response objects', async () => {
    const mockedNextApiRoute = compose<
      MockedRequestWithFooFizz,
      MockedResponseWithBarBuzz
    >(
      {
        sharedErrorHandler: () => {
          return
        },
        middlewareChain: [withMockedFizzBuzz, withMockedFooBar]
      },
      (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ foo: request.foo, fizz: request.fizz }))
      }
    )

    const server = createDummyNextServer(mockedNextApiRoute)
    const response = await request(server).get('/')

    expect(response.body).toStrictEqual({ fizz: 'fizz', foo: 'foo' })
  })

  it('should compose 3 middleware chain in which one throws error and return 418 with error message in body from sharedErrorHandler', async () => {
    const mockedNextApiRoute = compose<
      MockedRequestWithFooFizz,
      MockedResponseWithBarBuzz
    >(
      {
        sharedErrorHandler: (error, request, response) => {
          response.statusCode = 418
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ message: error.message }))
        },
        middlewareChain: [withMockedFizzBuzz, withThrowError, withMockedFooBar]
      },
      (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ foo: request.foo, fizz: request.fizz }))
      }
    )

    const server = createDummyNextServer(mockedNextApiRoute)
    const response = await request(server).get('/')

    expect(response.status).toBe(418)
    expect(response.body).toStrictEqual({ message: 'im a teapot error message' })
  })
})

describe('convert used along with compose http functionality', () => {
  it('should compose 2 converted connect/express middleware to hofs and intercept its request and response objects', async () => {
    const withMockedConnectFooBar = convert(connectMockedFooBar)
    const withMockedConnectFizzBuzz = convert(connectMockedFizzBuzz)

    const mockedNextApiRoute = compose<
      MockedRequestWithFooFizz,
      MockedResponseWithBarBuzz
    >([withMockedConnectFizzBuzz, withMockedConnectFooBar], (request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ foo: request.foo, fizz: request.fizz }))
    })

    const server = createDummyNextServer(mockedNextApiRoute)
    const response = await request(server).get('/')

    expect(response.body).toStrictEqual({ fizz: 'fizz', foo: 'foo' })
  })

  it('should compose converted connect/express middleware with regular hof middleware and intercept its request and response objects', async () => {
    const withMockedConnectFooBar = convert(connectMockedFooBar)

    const mockedNextApiRoute = compose<
      MockedRequestWithFooFizz,
      MockedResponseWithBarBuzz
    >([withMockedFizzBuzz, withMockedConnectFooBar], (request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ foo: request.foo, fizz: request.fizz }))
    })

    const server = createDummyNextServer(mockedNextApiRoute)
    const response = await request(server).get('/')

    expect(response.body).toStrictEqual({ fizz: 'fizz', foo: 'foo' })
  })
})

describe("configure's functionality", () => {
  const customMiddleware = (handler, config) => (request, response) => {
    if (config.foo) {
      request.foo = config.foo
    } else {
      request.foo = 'foo'
    }
    handler(request, response)
  }

  it('should configure middleware with provided configuration and pass it correctly using compose', async () => {
    const config = { foo: 'bar' }

    const configuredMiddleware = configure(customMiddleware, config)

    const composedHandler = compose([configuredMiddleware], (request, response) => {
      response.setHeader('Content-Type', 'application/json')
      response.end(JSON.stringify({ foo: request.foo }))
    })

    const server = createDummyNextServer(composedHandler)
    const response = await request(server).get('/')

    expect(response.body.foo).toBe('bar')
  })

  it('should use default value when configuration is not provided', async () => {
    const config = {}
    const composedHandler = compose(
      [configure(customMiddleware, config)],
      (request, response) => {
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ foo: request.foo }))
      }
    )

    const server = createDummyNextServer(composedHandler)
    const response = await request(server).get('/')

    expect(response.body.foo).toBe('foo')
  })
})
