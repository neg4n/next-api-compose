# Next.js API Compose &middot; [![version](https://badgen.net/npm/v/next-api-compose)](https://www.npmjs.com/package/next-api-compose) [![types](https://badgen.net/npm/types/next-api-compose)](https://www.npmjs.com/package/next-api-compose) [![npm bundle size](https://badgen.net/bundlephobia/minzip/next-api-compose)](https://bundlephobia.com/package/next-api-compose) [![license](https://badgen.net/npm/license/next-api-compose)]()

## Introduction

This library provides simple yet complete higher order function  
with responsibility of composing multiple middleware functions into one [Next.js API route][next-api-routes] handler.

The library **does not** contain routing utilities. I believe mechanism built in  
[Next.js][next-homepage] itself or [next-connect][next-connect] library are pretty enough solutions.

## Features

- [x] 😇 Simple and powerful API
- [x] 🧬 Maintaining order of middleware chain
- [x] 🔧 Compatible with [Express][express]/[Connect][connect] middleware
- [x] 💢 Error handling
- [x] 📦 No dependencies
- [ ] 💯 100% Test coverage

## Installing

```sh
npm i next-api-compose -S
# or
yarn add next-api-compose
```

## Basic usage:

```js
import { compose } from 'next-api-compose'

export default compose([withBar, withFoo], (request, response) => {
  const { foo, bar } = request
  response.status(200).json({ foo, bar })
})
```

_the `withBar` middleware will append `bar` property to `request` object, then `withFoo` will do accordingly the same but with `foo` property_

## Using Express or Connect middleware

If you want to use `next-api-compose` along with [Connect][connect] middleware that is widely used eg. in [Express][express] framework, there is special utility function for it.

```js
import { compose, convert } from 'next-api-compose'
import helmet from 'helmet'

const withHelmet = convert(helmet())

export default compose([withBar, withFoo, withHelmet], (request, response) => {
  const { foo, bar } = request
  response.status(200).json({ foo, bar })
})
```

_in this example, popular middleware [helmet][helmet] is converted using utility function from `next-api-compose` and passed as one element in middleware chain_

## Advanced usage:

```js
import { compose } from 'next-api-compose'

export default compose(
  { sharedErrorHandler, middlewareChain: [withBar, withFoo, withError] },
  (request, response) => { // This is unreachable because   ^^^^^^^^^ will return 418 status.
    const { foo, bar } = request
    response.status(200).json({ foo, bar })
  }
)

async function sharedErrorHandler(error, _request, response) {
  response.status(418).json({ error: error.message })
}

function withFoo(handler) {
  return async function (request, response) {
    request.foo = 'foo'
    return handler(request, response)
  }
}

function withBar(handler) {
  return async function (request, response) {
    request.bar = 'bar'
    return handler(request, response)
  }
}

function withError() {
  return async function () {
    throw new Error('some error')
  }
}
```

## TypeScript

```ts
import type { NextApiRequest, NextApiResponse } from 'next'
import type {
  ExtendedNextApiHandler,
  NextApiComposeMiddlewares,
  NextApiComposeOptions
} from 'next-api-compose'
import { compose } from 'next-api-compose'

type NextApiRequestWithFoo = NextApiRequest & Partial<{ foo: string }>
type NextApiRequestWithBar = NextApiRequest & Partial<{ bar: string }>
type NextApiRequestWithFooBar = NextApiRequestWithFoo & NextApiRequestWithBar

const mws: NextApiComposeMiddlewares<NextApiRequestWithFooBar> = [withFoo, withBar]
const options: NextApiComposeOptions<NextApiRequestWithFooBar> = {
  sharedErrorHandler: handleErrors,
  middlewareChain: mws
}

export default compose<NextApiRequestWithFooBar>(options, (request, response) => {
  const { foo, bar } = request
  response.status(200).json({ foo, bar })
})

function handleErrors(error: Error, _request: NextApiRequest, response: NextApiResponse) {
  response.status(418).json({ error: error.message })
}

function withFoo(handler: ExtendedNextApiHandler<NextApiRequestWithFoo>) {
  return async function (request: NextApiRequestWithFoo, response: NextApiResponse) {
    request.foo = 'foo'
    return handler(request, response)
  }
}

function withBar(handler: ExtendedNextApiHandler<NextApiRequestWithBar>) {
  return async function (request: NextApiRequestWithBar, response: NextApiResponse) {
    request.bar = 'bar'
    return handler(request, response)
  }
}
```

## Caveats

1.  You may need to add

    ```js
    export const config = {
      api: {
        externalResolver: true
      }
    }
    ```

    to your [Next.js API route configuration][next-api-routes-config] in order to dismiss false positive
    about stalled API requests.  
    Discussion about this can be found [on the Next.js GitHub repository page][next-stalled-requests-discussion].

2.  If you are using TypeScript and strict types *(no `any` at all)*, you may want to use [Partial][typescript-partial]

    ```ts
    type NextApiRequestWithFoo = NextApiRequest & Partial<{ foo: string }>
    ```

    when extending [API Route parameters' objects][next-extending-api-parameters] to avoid type errors during usage of `compose`.

## License

This project is licensed under the MIT license.  
All contributions are welcome.

[helmet]: https://github.com/helmetjs/helmet
[connect]: https://github.com/senchalabs/connect
[express]: https://expressjs.com
[next-homepage]: https://nextjs.org/
[next-stalled-requests-discussion]: https://github.com/vercel/next.js/issues/10439#issuecomment-583214126
[typescript-partial]: https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype
[next-connect]: https://github.com/hoangvvo/next-connect
[next-extending-api-parameters]: https://nextjs.org/docs/api-routes/api-middlewares#extending-the-reqres-objects-with-typescript
[next-api-routes-config]: https://nextjs.org/docs/api-routes/api-middlewares#custom-config
[next-api-routes]: https://nextjs.org/docs/api-routes/introduction
