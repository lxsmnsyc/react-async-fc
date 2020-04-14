import * as React from 'react';
import createSuspenseful from './create-suspenseful';
import createNonSuspense from './create-non-suspense';
import { AsyncFunctionComponent, AsyncFCOptions, AsyncFCProps } from './types';


export default function asyncFC<P = {}>(
  render: AsyncFunctionComponent<P>,
  options: AsyncFCOptions<P>,
): React.FC<P & AsyncFCProps> {
  const suspenseful = (options && (options.suspense || options.suspense == null));

  if (suspenseful) {
    return createSuspenseful(render, options);
  }
  return createNonSuspense(render, options);
}
