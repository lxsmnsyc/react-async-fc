import Subscription from './subscription';

export type AsyncFunctionComponentPropless =
  (subscription: Subscription) => Promise<JSX.Element>;

export type AsyncFunctionComponent<P> =
  (props: P, subscription: Subscription) => Promise<JSX.Element>;

export type Dependencies<P> = (props: P) => React.DependencyList;

export interface AsyncFCProps {
  fallback?: React.ReactNode;
}

export interface AsyncFCOptions<P> {
  defaultFallback?: React.ReactNode;
  suspense?: boolean;
  dependencies: Dependencies<P>;
}
