import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { StateLineage } from './state-lineage';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    StateLineage,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
