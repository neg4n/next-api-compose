# Migration guide for next-api-compose v2.0.0

The old version supported only the Pages Directory API Routes. The new version supports both Pages Directory API Routes and the App Directory API Routes.

In order to migrate from versions below v2.0.0, the only thing you need to do is to change the import statement from:

```js
import { compose } from "next-api-compose";
```

to:

```js
import { compose } from "next-api-compose/pages";
```

any other imported functions from the library should be imported from the same module.

e.g.

```js
import { compose, convert } from "next-api-compose/pages";
```

Back to the [README.md](./README.md)
