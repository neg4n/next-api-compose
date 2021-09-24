import type { NextApiRequest, NextApiResponse } from 'next'
import type { IncomingMessage, OutgoingMessage, ServerResponse } from 'http'

export type MockedNextRequestWithFoo = NextApiRequest & Partial<{ foo: string }>
export type MockedNextResponseWithBar = NextApiResponse & Partial<{ bar: string }>
type MockedRequestWithFoo = IncomingMessage & Partial<{ foo: string }>
type MockedResponseWithBar = OutgoingMessage & Partial<{ bar: string }>

type MockedNextFooBarHandler = (
  request: MockedNextRequestWithFoo,
  response: MockedNextResponseWithBar
) => void

export type MockedNextRequestWithFizz = NextApiRequest & Partial<{ fizz: string }>
export type MockedNextResponseWithBuzz = NextApiResponse & Partial<{ buzz: string }>
type MockedRequestWithFizz = IncomingMessage & Partial<{ fizz: string }>
type MockedResponseWithBuzz = OutgoingMessage & Partial<{ buzz: string }>

type MockedNextFizzBuzzHandler = (
  request: MockedNextRequestWithFizz,
  response: MockedNextResponseWithBuzz
) => void

export function withMockedFooBar(handler: MockedNextFooBarHandler) {
  return (request: MockedNextRequestWithFoo, response: MockedNextResponseWithBar) => {
    request.foo = 'foo'
    response.bar = 'bar'
    handler(request, response)
  }
}

export function withMockedFizzBuzz(handler: MockedNextFizzBuzzHandler) {
  return (request: MockedNextRequestWithFizz, response: MockedNextResponseWithBuzz) => {
    request.fizz = 'fizz'
    response.buzz = 'buzz'
    handler(request, response)
  }
}

export function connectMockedFooBar(
  request: MockedRequestWithFoo,
  response: MockedResponseWithBar,
  next: () => void
) {
  request.foo = 'foo'
  response.bar = 'bar'
  next()
}

export function connectMockedFizzBuzz(
  request: MockedRequestWithFizz,
  response: MockedResponseWithBuzz,
  next: () => void
) {
  request.fizz = 'fizz'
  response.buzz = 'buzz'
  next()
}

export function withThrowError() {
  return () => {
    throw new Error('im a teapot error message')
  }
}
