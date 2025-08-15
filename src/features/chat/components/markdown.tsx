import MarkdownPreview from '@uiw/react-markdown-preview';
import { memo } from 'react';
import { useTheme } from '@/shared/components/theme-provider';
import './markdown.css';
import type React from 'react';
import type { ReactNode } from 'react';
import { getCodeString } from 'rehype-rewrite';
import rehypeSanitize from 'rehype-sanitize';
import { ImageZoom } from '@/shared/components/ui/shadcn-io/image-zoom';
import { MermaidCode } from './markdown-mermaid';

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: ReactNode;
  node?: {
    children?: any[];
  };
  [key: string]: any;
}

interface ImageProps {
  src?: string;
  alt?: string;
  title?: string;
  className?: string;
  [key: string]: any;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt,
  title,
  className,
  ...props
}) => {
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
  ) => {
    // 图片加载失败时的处理
    console.warn('Image failed to load:', src);
    // 可以设置默认图片或显示错误状态
  };

  return (
    <ImageZoom zoomMargin={100}>
      <img
        src={src}
        alt={alt || ''}
        title={title}
        className={`markdown-image ${className || ''}`}
        onError={handleImageError}
        style={{
          cursor: 'pointer',
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '4px',
          transition: 'opacity 0.2s ease-in-out',
        }}
        {...props}
      />
    </ImageZoom>
  );
};

const Code: React.FC<CodeProps> = ({
  inline,
  children = [],
  className,
  ...props
}) => {
  const isMermaid =
    className && /^language-mermaid/.test(className.toLocaleLowerCase());
  // original code component
  const code: string = props.node?.children
    ? getCodeString(props.node.children)
    : Array.isArray(children) && children[0]
      ? String(children[0])
      : '';

  if (isMermaid) {
    return <MermaidCode code={code} className={className} />;
  }
  return <code>{children}</code>;
};

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const { resolvedTheme } = useTheme();
  const rehypePlugins = [rehypeSanitize];
  return (
    <MarkdownPreview
      source={children}
      className="!bg-transparent markdown-preview-content"
      wrapperElement={{
        'data-color-mode': resolvedTheme as 'light' | 'dark',
      }}
      rehypePlugins={rehypePlugins}
      components={{
        code: Code,
        img: Image,
      }}
    />
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
