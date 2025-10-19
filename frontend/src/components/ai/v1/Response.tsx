/**
 * Copyright 2023 Vercel, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client';

import { cn } from '@/lib/utils';
import type { ComponentProps, HTMLAttributes } from 'react';
import { isValidElement, memo } from 'react';
import ReactMarkdown, { type Options } from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { CodeBlock, CodeBlockCopyButton } from './CodeBlock';
import 'katex/dist/katex.min.css';
import hardenReactMarkdown from 'harden-react-markdown';


/**
 * Parses markdown text and removes incomplete tokens to prevent partial rendering
 * of links, images, bold, and italic formatting during streaming.
 */
function parseIncompleteMarkdown(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let result = text;

  // Handle incomplete links and images
  // Pattern: [...] or ![...] where the closing ] is missing
  const linkImagePattern = /(!?\[)([^\]]*?)$/;
  const linkMatch = result.match(linkImagePattern);
  if (linkMatch) {
    // If we have an unterminated [ or ![ , remove it and everything after
    const startIndex = result.lastIndexOf(linkMatch[1]);
    result = result.substring(0, startIndex);
  }

  // Handle incomplete bold formatting (**)
  const boldPattern = /(\*\*)([^*]*?)$/;
  const boldMatch = result.match(boldPattern);
  if (boldMatch) {
    // Count the number of ** in the entire string
    const asteriskPairs = (result.match(/\*\*/g) || []).length;
    // If odd number of **, we have an incomplete bold - complete it
    if (asteriskPairs % 2 === 1) {
      result = `${result}**`;
    }
  }

  // Handle incomplete italic formatting (__)
  const italicPattern = /(__)([^_]*?)$/;
  const italicMatch = result.match(italicPattern);
  if (italicMatch) {
    // Count the number of __ in the entire string
    const underscorePairs = (result.match(/__/g) || []).length;
    // If odd number of __, we have an incomplete italic - complete it
    if (underscorePairs % 2 === 1) {
      result = `${result}__`;
    }
  }

  // Handle incomplete single asterisk italic (*)
  const singleAsteriskPattern = /(\*)([^*]*?)$/;
  const singleAsteriskMatch = result.match(singleAsteriskPattern);
  if (singleAsteriskMatch) {
    // Count single asterisks that aren't part of **
    const singleAsterisks = result.split('').reduce((acc, char, index) => {
      if (char === '*') {
        // Check if it's part of a ** pair
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== '*' && nextChar !== '*' ) {
          return acc + 1;
        }
      }
      return acc;
    }, 0);

    // If odd number of single *, we have an incomplete italic - complete it
    if (singleAsterisks % 2 === 1) {
      result = `${result}*`;
    }
  }

  // Handle incomplete single underscore italic (_)
  const singleUnderscorePattern = /(_)([^_]*?)$/;
  const singleUnderscoreMatch = result.match(singleUnderscorePattern);
  if (singleUnderscoreMatch) {
    // Count single underscores that aren't part of __
    const singleUnderscores = result.split('').reduce((acc, char, index) => {
      if (char === '_') {
        // Check if it's part of a __ pair
        const prevChar = result[index - 1];
        const nextChar = result[index + 1];
        if (prevChar !== '_' && nextChar !== '_' ) {
          return acc + 1;
        }
      }
      return acc;
    }, 0);

    // If odd number of single _, we have an incomplete italic - complete it
    if (singleUnderscores % 2 === 1) {
      result = `${result}_`;
    }
  }

  // Handle incomplete inline code blocks (`) - but avoid code blocks (```)
  const inlineCodePattern = /(`)([^`]*?)$/;
  const inlineCodeMatch = result.match(inlineCodePattern);
  if (inlineCodeMatch) {
    // Check if we're dealing with a code block (triple backticks)
    const hasCodeBlockStart = result.includes('```');
    const codeBlockPattern = /```[\s\S]*?```/g;
    const completeCodeBlocks = (result.match(codeBlockPattern) || []).length;
    const allTripleBackticks = (result.match(/```/g) || []).length;

    // If we have an odd number of ``` sequences, we're inside an incomplete code block
    // In this case, don't complete inline code
    const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;

    if (!insideIncompleteCodeBlock) {
      // Count the number of single backticks that are NOT part of triple backticks
      let singleBacktickCount = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i] === '`') {
          // Check if this backtick is part of a triple backtick sequence
          const isTripleStart = result.substring(i, i + 3) === '```';
          const isTripleMiddle =
            i > 0 && result.substring(i - 1, i + 2) === '```';
          const isTripleEnd = i > 1 && result.substring(i - 2, i + 1) === '```';

          if (!(isTripleStart || isTripleMiddle || isTripleEnd)) {
            singleBacktickCount++;
          }
        }
      }

      // If odd number of single backticks, we have an incomplete inline code - complete it
      if (singleBacktickCount % 2 === 1) {
        result = `${result}\``;
      }
    }
  }

  // Handle incomplete strikethrough formatting (~~)
  const strikethroughPattern = /(~~)([^~]*?)$/;
  const strikethroughMatch = result.match(strikethroughPattern);
  if (strikethroughMatch) {
    // Count the number of ~~ in the entire string
    const tildePairs = (result.match(/~~/g) || []).length;
    // If odd number of ~~, we have an incomplete strikethrough - complete it
    if (tildePairs % 2 === 1) {
      result = `${result}~~`;
    }
  }

  return result;
}

// Create a hardened version of ReactMarkdown
const HardenedMarkdown = hardenReactMarkdown(ReactMarkdown);

export type ResponseProps = HTMLAttributes<HTMLDivElement> & {
  options?: Options;
  children: Options['children'];
  allowedImagePrefixes?: ComponentProps<
    typeof HardenedMarkdown
  >['allowedImagePrefixes'];
  allowedLinkPrefixes?: ComponentProps<
    typeof HardenedMarkdown
  >['allowedLinkPrefixes'];
  defaultOrigin?: ComponentProps<
    typeof HardenedMarkdown
  >['defaultOrigin'];
  parseIncompleteMarkdown?: boolean;
};

const components: Options['components'] = {
  ol: ({ node, children, className, ...props }) => (
    <ol className={cn('my-4 ml-6 list-decimal',
      className
    )}
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ node, children, className, ...props }) => (
    <li className={cn('mt-2',
      className
    )}
      {...props}
    >
      {children}
    </li>
  ),
  ul: ({ node, children, className, ...props }) => (
    <ul className={cn('my-4 ml-6 list-disc',
      className
    )}
      {...props}
    >
      {children}
    </ul>
  ),
  hr: ({ node, className, ...props }) => (
    <hr className={cn('my-4 md:my-6',
      className
    )}
      {...props}
    />
  ),
  strong: ({ node, children, className, ...props }) => (
    <strong className={cn('font-bold',
      className
    )}
      {...props}
    >
      {children}
    </strong>
  ),
  a: ({ node, children, className, ...props }) => (
    <a className={cn('font-medium underline underline-offset-4',
      className
    )}
      {...props}
    >
      {children}
    </a>
  ),
  h1: ({ node, children, className, ...props }) => (
    <h1 className={cn('mt-8 text-4xl font-bold tracking-tight',
      className
    )}
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, className, ...props }) => (
    <h2 className={cn('mt-8 text-3xl font-bold tracking-tight',
      className
    )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ node, children, className, ...props }) => (
    <h3 className={cn('mt-8 text-2xl font-bold tracking-tight',
      className
    )}
      {...props}
    >
      {children}
    </h3>
  ),
  h4: ({ node, children, className, ...props }) => (
    <h4 className={cn('mt-8 text-xl font-bold tracking-tight',
      className
    )}
      {...props}
    >
      {children}
    </h4>
  ),
  h5: ({ node, children, className, ...props }) => (
    <h5 className={cn('mt-8 text-lg font-bold tracking-tight',
      className
    )}
      {...props}
    >
      {children}
    </h5>
  ),
  h6: ({ node, children, className, ...props }) => (
    <h6 className={cn('mt-8 text-base font-bold tracking-tight',
      className
    )}
      {...props}
    >
      {children}
    </h6>
  ),
  table: ({ node, children, className, ...props }) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn('w-full text-left',
        className
      )}
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ node, children, className, ...props }) => (
    <thead className={cn('border-b',
      className
    )}
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ node, children, className, ...props }) => (
    <tbody className={cn('even:bg-muted',
      className
    )}
      {...props}
    >
      {children}
    </tbody>
  ),
  tr: ({ node, children, className, ...props }) => (
    <tr className={cn('m-0 border-t p-0 even:bg-muted',
      className
    )}
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ node, children, className, ...props }) => (
    <th className={cn('border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
      className
    )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ node, children, className, ...props }) => (
    <td className={cn('border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
      className
    )}
      {...props}
    >
      {children}
    </td>
  ),
  blockquote: ({ node, children, className, ...props }) => (
    <blockquote
      className={cn('mt-6 border-l-2 pl-6 italic',
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ node, className, ...props }) => {
    const inline = node?.position?.start.line === node?.position?.end.line;

    if (!inline) {
      return (
        <CodeBlock
          code={String(props.children).replace(/\n$/, '')}
          language={className?.replace('language-', '') || 'javascript'}
        >
          <CodeBlockCopyButton />
        </CodeBlock>
      );
    }

    return (
      <code
        className={cn(
          'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
          className
        )}
        {...props}
      />
    );
  },
  pre: ({ node, className, children }) => {
    let language = 'javascript';

    if (typeof node?.properties?.className === 'string') {
      language = node.properties.className.replace('language-', '');
    }

    // Extract code content from children safely
    let code = '';
    if (
      isValidElement(children) &&
      children.props &&
      typeof (children.props as any).children === 'string'
    ) {
      code = (children.props as any).children;
    } else if (typeof children === 'string') {
      code = children;
    }

    return (
      <CodeBlock
        code={code}
        language={language}
      >
        <CodeBlockCopyButton
          onCopy={() => console.log('Copied code to clipboard')}
          onError={() => console.error('Failed to copy code to clipboard')}
        />
      </CodeBlock>
    );
  },
};

export const Response = memo(
  ({
    className,
    options,
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
    parseIncompleteMarkdown: shouldParseIncompleteMarkdown = true,
    ...props
  }: ResponseProps) => {
    // Parse the children to remove incomplete markdown tokens if enabled
    const parsedChildren = 
      typeof children === 'string' && shouldParseIncompleteMarkdown
        ? parseIncompleteMarkdown(children)
        : children;

    return (
      <div
        className={cn(
          'prose dark:prose-invert prose-p:leading-normal prose-li:whitespace-pre-wrap break-words [&_p:not(:first-child)]:mt-4 [&_ol]:my-4 [&_ul]:my-4 [&_li]:mt-2 [&_li_p]:m-0 [&_li>*:first-child]:mt-0 [&_li>*:last-child]:mb-0 [&_blockquote]:my-4 [&_h1]:mt-8 [&_h2]:mt-8 [&_h3]:mt-8 [&_h4]:mt-8 [&_h5]:mt-8 [&_h6]:mt-8 [&_pre]:my-4 [&_table]:my-4 [&_figure]:my-4 [&_img]:my-4 [&_hr]:my-4 [&_strong]:font-bold [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-4 [&_code]:relative [&_code]:rounded [&_code]:bg-muted [&_code]:px-[0.3rem] [&_code]:py-[0.2rem] [&_code]:font-mono [&_code]:text-sm [&_code]:font-semibold [&_code]:break-words [&_code]:before:hidden [&_code]:after:hidden [&_pre_code]:p-0 [&_pre_code]:before:hidden [&_pre_code]:after:hidden [&_pre_code]:text-base [&_pre_code]:bg-transparent [&_pre_code]:rounded-none [&_pre_code]:font-normal [&_pre_code]:whitespace-pre-wrap [&_pre_code]:break-normal [&_pre_code]:overflow-x-auto [&_pre_code]:block [&_pre_code]:w-full [&_pre_code]:max-w-full [&_pre_code]:min-w-0 [&_pre_code]:min-h-0 [&_pre_code]:text-inherit [&_pre_code]:leading-normal [&_pre_code]:align-baseline [&_pre_code]:shadow-none [&_pre_code]:border-none [&_pre_code]:ring-0 [&_pre_code]:focus:outline-none [&_pre_code]:focus:ring-0 [&_pre_pre]:p-0 [&_pre_pre]:before:hidden [&_pre_pre]:after:hidden [&_pre_pre]:text-base [&_pre_pre]:bg-transparent [&_pre_pre]:rounded-none [&_pre_pre]:font-normal [&_pre_pre]:whitespace-pre-wrap [&_pre_pre]:break-normal [&_pre_pre]:overflow-x-auto [&_pre_pre]:block [&_pre_pre]:w-full [&_pre_pre]:max-w-full [&_pre_pre]:min-w-0 [&_pre_pre]:min-h-0 [&_pre_pre]:text-inherit [&_pre_pre]:leading-normal [&_pre_pre]:align-baseline [&_pre_pre]:shadow-none [&_pre_pre]:border-none [&_pre_pre]:ring-0 [&_pre_pre]:focus:outline-none [&_pre_pre]:focus:ring-0 [&_*:first-child]:mt-0 [&_*:last-child]:mb-0',
          className
        )}
        {...props}
      >
        <HardenedMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={components}
          allowedImagePrefixes={allowedImagePrefixes}
          allowedLinkPrefixes={allowedLinkPrefixes}
          defaultOrigin={defaultOrigin}
          {...options}
        >
          {parsedChildren}
        </HardenedMarkdown>
      </div>
    );
  },
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = 'Response';
