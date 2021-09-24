import type { NextApiRequest, NextApiResponse } from 'next'
import { createServer } from 'http'
import request from 'supertest'

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
import { compose, convert } from '../src'

type MockedRequestWithFooFizz = MockedNextRequestWithFoo & MockedNextRequestWithFizz
type MockedResponseWithBarBuzz = MockedNextResponseWithBar & MockedNextResponseWithBuzz

function createDummyNextServer(handler) {
  return createServer((request, response) => {
    return handler(request as NextApiRequest, response as NextApiResponse)
  })
}

describe(compose, () => {
  it('should execute final handler if empty middleware chain is provided', async () => {
    const handler = compose([], (request, response) => {
      response.end('im empty')
    })

    const server = createDummyNextServer(handler)

    await request(server).get('/').expect('im empty')
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

    await request(server).get('/').expect({ fizz: 'fizz', foo: 'foo' })
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

    await request(server).get('/').expect({ fizz: 'fizz', foo: 'foo' })
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

    await request(server)
      .get('/')
      .expect(418)
      .expect({ message: 'im a teapot error message' })
  })
})

describe(convert, () => {
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

    await request(server).get('/').expect({ fizz: 'fizz', foo: 'foo' })
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

    await request(server).get('/').expect({ fizz: 'fizz', foo: 'foo' })
  })
})
