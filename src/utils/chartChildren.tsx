import React from 'react';

/**
 * Recharts v2 discovers its graphical items (Area/Line/Bar/...) by walking the
 * chart's children, and it relies on react-is@18 `isFragment` to look inside a
 * `<>...</>` wrapper. react-is@18 cannot recognise React 19 elements (they now
 * carry `Symbol.for('react.transitional.element')`), so any series returned
 * inside a fragment is silently dropped: no areas, no Y-axis domain, no legend.
 *
 * Flattening fragments ourselves hands Recharts a plain array of series, which
 * `React.Children` walks correctly regardless of react-is.
 */
export function flattenSeries(node: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(node).flatMap((child) =>
    React.isValidElement(child) && child.type === React.Fragment
      ? flattenSeries((child.props as { children?: React.ReactNode }).children)
      : [child]
  );
}
