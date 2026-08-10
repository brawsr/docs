'use client';

import { captureDocsEvent } from '@/lib/analytics';
import {
  CodeBlock,
  Pre,
  type CodeBlockProps,
} from 'fumadocs-ui/components/codeblock';
import type { ComponentPropsWithoutRef, MouseEvent } from 'react';

export function TrackedCodeBlock({ onClickCapture, ...props }: CodeBlockProps) {
  function handleClickCapture(event: MouseEvent<HTMLElement>) {
    onClickCapture?.(event);

    const source = event.target;
    if (!(source instanceof Element)) return;

    const copyButton = source.closest<HTMLButtonElement>('button[aria-label="Copy Text"]');
    if (!copyButton) return;

    captureDocsEvent('docs_copy_code', {
      placement: 'code_block',
      target: 'clipboard',
    });
  }

  return (
    <CodeBlock
      {...props}
      data-analytics-container="code-block"
      onClickCapture={handleClickCapture}
    />
  );
}

export function TrackedPre({
  children,
  ...props
}: ComponentPropsWithoutRef<'pre'>) {
  return (
    <TrackedCodeBlock {...(props as CodeBlockProps)}>
      <Pre>{children}</Pre>
    </TrackedCodeBlock>
  );
}
