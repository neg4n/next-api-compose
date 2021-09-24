# Next.js API Compose &middot; [![version](https://badgen.net/npm/v/next-api-compose)](https://www.npmjs.com/package/next-api-compose) [![codecov](https://codecov.io/gh/neg4n/next-api-compose/branch/development/graph/badge.svg?token=VDJSVV76LD)](https://codecov.io/gh/neg4n/next-api-compose) [![CodeFactor](https://www.codefactor.io/repository/github/neg4n/next-api-compose/badge)](https://www.codefactor.io/repository/github/neg4n/next-api-compose) [![npm bundle size](https://badgen.net/bundlephobia/minzip/next-api-compose)](https://bundlephobia.com/package/next-api-compose)

## Introduction

This library provides simple yet complete higher order function  
with responsibility of composing multiple middleware functions into one [Next.js API route][next-api-routes] handler.

The library **does not** contain routing utilities. I believe mechanism built in  
[Next.js][next-homepage] itself or [next-connect][next-connect] library are sufficient solutions.

## Features

- [x] 😇 Simple and powerful API
- [x] 🥷 TypeScript support
- [x] 🧬 Maintaining order of middleware chain
- [x] 🔧 Compatible with [Express][express]/[Connect][connect] middleware
- [x] 💢 Error handling
- [x] 📦 No dependencies
- [x] 💯 100% Test coverage

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

## Examples

You can find more examples here:

- JavaScript
  - [Basic usage with error handling][basic-error-handling]
  - [Basic usage with Connect/Express middleware][basic-express-middleware]
- TypeScript
  - [Basic usage with TypeScript][basic-typescript]
  - [Advanced & complete usage with TypeScript][advanced-typescript-complete]

_the `example/` directory contains simple [Next.js][next-homepage] application implementing `next-api-compose` . To fully explore examples implemented in it by yourself - simply do `cd examples && npm i && npm run dev` then navigate to http://localhost:3000/_

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

2.  If you are using TypeScript and strict types _(no `any` at all)_, you may want to use [Partial][typescript-partial]

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
[basic-error-handling]: https://github.com/neg4n/next-api-compose/tree/main/example/pages/api/basic-error-handling.js
[basic-express-middleware]: https://github.com/neg4n/next-api-compose/tree/main/example/pages/api/basic-express-middleware.js
[basic-typescript]: https://github.com/neg4n/next-api-compose/tree/main/example/pages/api/basic-typescript.ts
[advanced-typescript-complete]: https://github.com/neg4n/next-api-compose/tree/main/example/pages/api/advanced-typescript-complete.ts
