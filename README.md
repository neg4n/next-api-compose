# Next.js Compose API

## Introduction

This library provides simple yet complete higher order function  
with responsibility of composing multiple middleware functions into one [Next.js API route][next-api-routes] handler.

## Features

- [x] 😇 Simple and powerful API
- [x] 🧬 Maintaining order of middleware chain
- [x] 💢 Error handling
- [x] 📦 No dependencies
- [ ] 🔧 Utility to convert Express middleware to Next.js HOF

### Sample usage:

```js
import { compose } from 'next-api-compose'

export default compose([withBar, withFoo], (request, response) => {
  const { foo, bar } = request
  response.status(200).json({ foo, bar })
})
```

[next-homepage]: https://nextjs.org/
[next-api-routes]: https://nextjs.org/docs/api-routes/introduction
