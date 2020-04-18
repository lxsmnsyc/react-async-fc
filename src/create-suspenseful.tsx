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
    if (isRefFunction(cacheRef) || !cacheRef) {
      throw new NoCacheRefError();
    }
    const shouldRefetch = compareDeps(deps, cacheRef.current?.dependencies);

    if (cacheRef.current == null || shouldRefetch) {
      if (cacheRef.current?.state === 'pending') {
        cacheRef.current.subscription.cancel();
      }

      const subscription = new Subscription();

      cacheRef.current = {
        state: 'pending',
        subscription,
        dependencies: deps,
        value: provider(subscription).then(
          (value) => {
            if (!subscription.isCancelled) {
              cacheRef.current = {
                state: 'success',
                value,
                dependencies: deps,
              };
            }
          },
          (value) => {
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
    const cacheRef = React.useRef<AsyncState | null>(null);

    useIsomorphicEffect(() => (): void => {
      if (cacheRef.current?.state === 'pending') {
        cacheRef.current.subscription.cancel();
      }
    }, []);

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
