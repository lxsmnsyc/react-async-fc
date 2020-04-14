
export type AsyncFunctionComponent<P> = (props: P) => Promise<JSX.Element>;

export type KeySupplier<P> = (props: P) => string;

export interface AsyncFCProps {
  fallback?: React.ReactNode;
}

export interface AsyncFCOptions<P> {
  defaultFallback?: React.ReactNode;
  suspense?: boolean;
  keySupplier: KeySupplier<P>;
}
