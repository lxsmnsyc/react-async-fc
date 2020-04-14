import React from 'react';
import { AsyncFCOptions, AsyncFunctionComponent, AsyncFCProps } from './types';
import useIsomorphicEffect from './utils/useIsomorphicEffect';

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
  { defaultFallback, keySupplier }: AsyncFCOptions<P>,
): React.FC<P & AsyncFCProps> {
  return function Async({ fallback, ...props }: AsyncFCProps & P): JSX.Element {
    const [state, setState] = React.useState<AsyncState>({
      state: 'pending',
    });

    const key = React.useMemo(() => keySupplier(props as P), [props]);

    useIsomorphicEffect(() => {
      let mounted = true;

      render(props as P).then(
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
        mounted = false;
      };
    }, [key]);

    switch (state.state) {
      case 'pending':
        return <>{ fallback ?? defaultFallback }</>;
      case 'failure':
        throw state.value;
      case 'success':
        return state.value;
      default:
        return <>{ fallback ?? defaultFallback }</>;
    }
  };
}
