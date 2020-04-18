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
    const [state, setState] = React.useState<AsyncState | null>(null);

    useIsomorphicEffect(() => {
      setState({
        state: 'pending',
      });

      let mounted = true;

      const subscription = new Subscription();

      render(props as P, subscription).then(
        (value: JSX.Element) => {
          if (mounted) {
            setState({
              state: 'success',
              value,
            });
          }
        },
        (value: any) => {
          if (mounted) {
            setState({
              state: 'failure',
              value,
            });
          }
        },
      );

      return (): void => {
        subscription.cancel();
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
