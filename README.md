# @lxsmnsyc/react-async-fc

> Write asynchronous functional components in React

[![NPM](https://img.shields.io/npm/v/@lxsmnsyc/react-async-fc.svg)](https://www.npmjs.com/package/@lxsmnsyc/react-async-fc) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save @lxsmnsyc/react-async-fc
```

```bash
yarn add @lxsmnsyc/react-async-fc
```

## Usage

### the `asyncFC` function

The library exports a single function called `asyncFC` which wraps your asynchronous functional component.

```tsx
import asyncFC from '@lxsmnsyc/react-async-fc';
```

The function will accept to values:
- the render function. This function accepts two parameters: the `props` and the `subscription`. The `subscription` allows you to manage the lifecycle of the component.
- the options object. This object requires a function called `dependencies` which declares when should the component re-render itself. There are optional properties: `suspense` is a boolean property which tells if the component should use `React.Suspense` internally or not. `defaultFallback` is a node which is used as a render fallback while the component is rendering.

The function returns a React component with additional `fallback` property which is used as a render fallback while the Promised component is resolving.

### Example

```tsx
import asyncFC from '@lxsmnsyc/react-async-fc';

const Sleeping = asyncFC(
  async ({ duration }, subscription) => {
    /**
     * Create a Promise timeout that resolves
     * once the timeout ends.
     */
    await new Promise((res) => {
      const timeout = setTimeout(res, duration, true)

      /**
       * Once the subscription is cancelled, we perform
       * the cleanup for the timeout instance.
       * 
       * This subscription instance is always cancelled when
       * the dependencies changes.
       */
      subscription.addListener(() => {
        clearTimeout(timeout);
      });
    });

    /**
     * Timeout is expired, render the elements.
     */
    return <h1>Woke up!</h1>;
  }, {
    /**
     * Only re-render the component when the duration changes.
     */
    dependencies: ({ duration }) => [duration],
    /**
     * Use Suspense for data fetching internally.
     */
    suspense: true,
  },
);


<Sleeping
  duration={state}
  fallback={<h1>Sleeping for {(state / 1000).toFixed(2)} seconds.</h1>}
/>
```

### Subscription

Render functions receives a second parameter called `subscription` which is an instance of the `Subscription` class. The `subscription` allows us to manage the lifecycle of the resolving Promised component. This value has 4 methods:
- `cancel` prompts the subscription to fire all registered callbacks. This is automatically fired when the component updates/unmounts while the component is trying to resolve.
- `addListener`/`removeListener` allows us to register/unregister callbacks when the `subscription` is cancelled.
- `isCancelled` is a getter method which checks if the subscription has been cancelled.

Although the `Subscription` may manage the component lifecycle, it may or may not stop the Promise from resolving.

### Downsides

The components cannot use React hooks.

## License

MIT © [lxsmnsyc](https://github.com/lxsmnsyc)