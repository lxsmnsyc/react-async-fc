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
import React, { Suspense } from 'react';
import {
  AsyncFCOptions, AsyncFunctionComponent, AsyncFCProps, AsyncFunctionComponentPropless,
} from './types';
import Subscription from './subscription';
import NoCacheRefError from './utils/no-cache-ref-error';
import compareDeps from './utils/compare-deps';
import useIsomorphicEffect from './utils/useIsomorphicEffect';

interface AsyncPending {
  subscription: Subscription;
  value: Promise<void>;
  state: 'pending';
  dependencies: React.DependencyList;
}

interface AsyncSuccess {
  value: JSX.Element;
  state: 'success';
  dependencies: React.DependencyList;
}

interface AsyncFailure {
  value: any;
  state: 'failure';
  dependencies: React.DependencyList;
}

type AsyncState = AsyncPending | AsyncSuccess | AsyncFailure;

type RefType<T> = ((instance: T | null) => void) | React.MutableRefObject<T | null> | null;

function isRefFunction<T>(ref: RefType<T>): ref is ((instance: T | null) => void) {
  return typeof ref === 'function';
}

export default function createSuspenseful<P = {}>(
  render: AsyncFunctionComponent<P>,
  { defaultFallback, dependencies }: AsyncFCOptions<P>,
): React.FC<P & AsyncFCProps> {
  function load(
    cacheRef: RefType<AsyncState | null> | null,
    provider: AsyncFunctionComponentPropless,
    deps: React.DependencyList,
  ): JSX.Element {
    /**
     * If cache ref is a function or cache ref does not exist,
     * throw an error.
     *
     * In reality, this wouldn't happen.
     */
    if (isRefFunction(cacheRef) || !cacheRef) {
      throw new NoCacheRefError();
    }

    /**
     * Compare dependency changes to decide
     * if we should refetch
     */
    const shouldRefetch = compareDeps(deps, cacheRef.current?.dependencies);

    /**
     * If there is no existing cache or if we decided to refetch
     * begin refetching.
     */
    if (cacheRef.current == null || shouldRefetch) {
      /**
       * If our previous cache is still pending,
       * cancel our previous subscription to initiate
       * cleanup.
       */
      if (cacheRef.current?.state === 'pending') {
        cacheRef.current.subscription.cancel();
      }

      /**
       * Create a new subscription instance.
       */
      const subscription = new Subscription();

      /**
       * Create cache reference
       */
      cacheRef.current = {
        state: 'pending',
        subscription,
        dependencies: deps,
        value: provider(subscription).then(
          (value) => {
            /**
             * Do not update cache if the subscription
             * is cancelled.
             *
             * This could happen since some promises
             * do not have a cancellation mechanism.
             */
            if (!subscription.isCancelled) {
              cacheRef.current = {
                state: 'success',
                value,
                dependencies: deps,
              };
            }
          },
          (value) => {
            /**
             * Do not update cache if the subscription
             * is cancelled.
             *
             * This could happen since some promises
             * do not have a cancellation mechanism.
             */
            if (!subscription.isCancelled) {
              cacheRef.current = {
                state: 'failure',
                value,
                dependencies: deps,
              };
            }
          },
        ),
      };

      /**
       * Throw the promise instance for the
       * Suspense to handle.
       */
      throw cacheRef.current.value;
    }

    switch (cacheRef.current.state) {
      case 'pending':
      case 'failure':
        throw cacheRef.current.value;
      case 'success':
        return cacheRef.current.value;
      default:
        return <></>;
    }
  }

  const Suspended = React.forwardRef<AsyncState | null, P>(
    (props, ref) => (
      load(
        ref,
        (subscription) => render(props, subscription),
        dependencies(props),
      )
    ),
  );

  function Base({ fallback, ...props }: P & AsyncFCProps): JSX.Element {
    /**
     * Create a component-level cache reference
     * that will hold our async state.
     */
    const cacheRef = React.useRef<AsyncState | null>(null);

    /**
     * In case the component unmounts, cancel
     * subscription to perform registered cleanups.
     */
    useIsomorphicEffect(() => (): void => {
      if (cacheRef.current?.state === 'pending') {
        cacheRef.current.subscription.cancel();
      }
    }, []);

    /**
     * If the window object does not exist (which signifies
     * that the component runs on SSR), render the fallback.
     */
    if (typeof window === 'undefined') {
      return (
        <>{ fallback ?? defaultFallback }</>
      );
    }

    return (
      <Suspense fallback={<>{ fallback ?? defaultFallback }</>}>
        <Suspended ref={cacheRef} {...(props as React.PropsWithoutRef<P>)} />
      </Suspense>
    );
  }

  return Base;
}
