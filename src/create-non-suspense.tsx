/**
 * @license
 * MIT License
 *
 * Copyright (c) 2020 Alexis Munsayac
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 *
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2020
 */
import React from 'react';
import { AsyncFCOptions, AsyncFunctionComponent, AsyncFCProps } from './types';
import useIsomorphicEffect from './utils/useIsomorphicEffect';
import Subscription from './subscription';

interface AsyncPending {
  state: 'pending';
}

interface AsyncSuccess {
  value: JSX.Element;
  state: 'success';
}

interface AsyncFailure {
  value: any;
  state: 'failure';
}

type AsyncState = AsyncPending | AsyncSuccess | AsyncFailure;

export default function createNonSuspense<P = {}>(
  render: AsyncFunctionComponent<P>,
  { defaultFallback, dependencies }: AsyncFCOptions<P>,
): React.FC<P & AsyncFCProps> {
  return function Async({ fallback, ...props }: AsyncFCProps & P): JSX.Element {
    /**
     * Create a state that will handle the async result of the render function.
     */
    const [state, setState] = React.useState<AsyncState | null>(null);

    useIsomorphicEffect(() => {
      /**
       * Set state to pending
       */
      setState({
        state: 'pending',
      });

      /**
       * Create a variable that tracks the lifecycle.
       */
      let mounted = true;

      /**
       * Create a subscription
       */
      const subscription = new Subscription();

      /**
       * Begin rendering
       */
      render(props as P, subscription).then(
        (value: JSX.Element) => {
          /**
           * Do not update state if the subscription
           * is cancelled.
           *
           * This could happen since some promises
           * do not have a cancellation mechanism.
           */
          if (mounted) {
            setState({
              state: 'success',
              value,
            });
          }
        },
        (value: any) => {
          /**
           * Do not update state if the subscription
           * is cancelled.
           *
           * This could happen since some promises
           * do not have a cancellation mechanism.
           */
          if (mounted) {
            setState({
              state: 'failure',
              value,
            });
          }
        },
      );

      return (): void => {
        /**
         * Cancel subscription to perform registered cleanup
         */
        subscription.cancel();
        /**
         * Set tracked lifecycle flag to false.
         */
        mounted = false;
      };
    }, dependencies(props as P));

    if (!state) {
      return <>{ fallback ?? defaultFallback }</>;
    }

    switch (state.state) {
      case 'failure':
        throw state.value;
      case 'success':
        return state.value;
      case 'pending':
      default:
        return <>{ fallback ?? defaultFallback }</>;
    }
  };
}
