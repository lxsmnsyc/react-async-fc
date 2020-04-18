import React from 'react';

export default function compareDeps(
  newDeps: React.DependencyList,
  oldDeps?: React.DependencyList,
): boolean {
  if (!oldDeps) {
    return true;
  }

  if (oldDeps.length !== newDeps.length) {
    return true;
  }

  const { length } = oldDeps;

  for (let i = 0; i < length; i += 1) {
    if (!Object.is(oldDeps[i], newDeps[i])) {
      return true;
    }
  }

  return false;
}
