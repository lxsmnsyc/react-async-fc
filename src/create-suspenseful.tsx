import React, { Suspense } from 'react';
import { AsyncFCOptions, AsyncFunctionComponent, AsyncFCProps } from './types';

interface AsyncPending {
  value: Promise<void>;
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


export default function createSuspenseful<P = {}>(
  render: AsyncFunctionComponent<P>,
  { defaultFallback, keySupplier }: AsyncFCOptions<P>,
): React.FC<P & AsyncFCProps> {
  const RESOURCES = new Map<string, AsyncState>();

  function load(
    key: string,
    provider: () => Promise<JSX.Element>,
  ): JSX.Element {
    let cachedResource = RESOURCES.get(key);

    if (!cachedResource) {
      cachedResource = {
        value: provider().then(
          (value) => {
            RESOURCES.set(key, {
              value,
              state: 'success',
            });
          },
          (value) => {
            RESOURCES.set(key, {
              value,
              state: 'failure',
            });
          },
        ),
        state: 'pending',
      };
      RESOURCES.set(key, cachedResource);
    }

    switch (cachedResource.state) {
      case 'failure':
        throw cachedResource.value;
      case 'success':
        return cachedResource.value;
      case 'pending':
        throw cachedResource.value;
      default:
        return <></>;
    }
  }

  function Suspended(props: P): JSX.Element {
    return load(
      keySupplier(props),
      () => render(props),
    );
  }

  function Base({ fallback, ...props }: P & AsyncFCProps): JSX.Element {
    if (typeof window === 'undefined') {
      return (
        <>{ fallback ?? defaultFallback }</>
      );
    }
    return (
      <Suspense fallback={<>{ fallback ?? defaultFallback }</>}>
        <Suspended {...(props as P)} />
      </Suspense>
    );
  }

  return Base;
}
