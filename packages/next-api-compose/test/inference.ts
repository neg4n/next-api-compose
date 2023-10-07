import { compose } from '../src/app'
import { A, O } from 'ts-toolbelt'
import type { NextRequest } from 'next/server'

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

      type HasBarProperty = O.Has<HandlerRequestType, 'bar', string>
      const assertHasBarProperty: HasBarProperty = 0

      return new Response(request.foo)
    }
  ]
})

export {}
