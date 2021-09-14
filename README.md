# Next.js Compose API &middot; [![version](https://badgen.net/npm/v/next-api-compose)](https://www.npmjs.com/package/next-api-compose) [![types](https://badgen.net/npm/types/next-api-compose)](https://www.npmjs.com/package/next-api-compose) [![npm bundle size](https://badgen.net/bundlephobia/minzip/next-api-compose)](https://bundlephobia.com/package/next-api-compose) [![license](https://badgen.net/npm/license/next-api-compose)]()

## Introduction

This library provides simple yet complete higher order function  
with responsibility of composing multiple middleware functions into one [Next.js API route][next-api-routes] handler.

## Features

- [x] 😇 Simple and powerful API
- [x] 🧬 Maintaining order of middleware chain
- [x] 💢 Error handling
- [x] 📦 No dependencies
- [ ] 🔧 Utility to convert Express middleware to [Next.js API HOF][next-api-routes]

## Basic sample usage:

```js
import { compose } from 'next-api-compose'

export default compose([withBar, withFoo], (request, response) => {
  const { foo, bar } = request
  response.status(200).json({ foo, bar })
})
```

_the `withBar` middleware will append `bar` property to `request` object, then `withFoo` will do accordingly the same but with `foo` property_

## License

This project is licensed under the MIT license.  
All contributions are welcome.

[next-homepage]: https://nextjs.org/
[next-api-routes]: https://nextjs.org/docs/api-routes/introduction
