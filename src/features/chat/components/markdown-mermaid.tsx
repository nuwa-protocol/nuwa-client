import mermaid from 'mermaid';
import type React from 'react';
import { useEffect, useId, useState } from 'react';

interface MermaidCodeProps {
  code: string;
  className?: string;
}

export const MermaidCode: React.FC<MermaidCodeProps> = ({
  code,
  className,
}) => {
  // Use React's built-in ID generator
  const uniqueId = useId().replace(/:/g, '-');
  const [showRaw, setShowRaw] = useState(false);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      fontFamily: 'Patrick Hand, Comic Sans MS, cursive',
      themeVariables: {
        primaryColor: '#f0f0f0',
        primaryTextColor: '#333333',
        lineColor: '#888888',
        fontSize: '16px',
        edgeLabelBackground: '#ffffff',
        background: 'transparent',
      },
      flowchart: {
        curve: 'basis',
        diagramPadding: 8,
      },
      themeCSS:
        '.mermaid { font-family: "Patrick Hand", "Comic Sans MS", cursive; background-color: transparent !important; } .mermaid svg { display: block; margin: 0 auto; }',
      deterministicIds: false, // required for handDrawn
      htmlLabels: true,
      look: 'handDrawn',
    });
  }, []);

  useEffect(() => {
    // Don't render if showing raw or no code
    if (showRaw) return;

    // Make sure we have code to render
    if (!code.trim()) {
      setRenderError('Empty diagram code');
      return;
    }

    // Set loading state
    setIsLoading(true);
    setRenderError('');

    // Create a unique ID for this render
    const diagramId = `mermaid-${uniqueId}-${Date.now()}`;

    // Direct rendering approach
    const renderDiagram = async () => {
      try {
        // Create container element
        const tempContainer = document.createElement('div');
        tempContainer.id = diagramId;
        tempContainer.style.visibility = 'hidden';
        document.body.appendChild(tempContainer);

        // Add the mermaid code to the container
        tempContainer.textContent = code;

        // Render it
        const { svg } = await mermaid.render(diagramId, code);

        // Update state with the result
        setRenderedSvg(svg);
        setRenderError('');

        // Cleanup
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      } catch (error) {
        setRenderError(
          `Rendering error: ${(error as Error).message || 'Unknown error'}`,
        );
        setRenderedSvg('');
      } finally {
        setIsLoading(false);
      }
    };

    // Run the render
    renderDiagram();
  }, [code, showRaw, uniqueId]);

  return (
    <div className="relative my-4 mermaid-wrapper bg-slate-100 rounded-xl">
      {showRaw ? (
        <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
          <code>{code}</code>
        </pre>
      ) : (
        <div
          className={`mermaid-container flex justify-center ${isLoading ? 'opacity-50' : ''}`}
          dangerouslySetInnerHTML={{
            __html:
              renderedSvg ||
              (renderError
                ? `<div class="text-red-500 p-2">${renderError}</div>`
                : '<div class="flex justify-center p-4">Loading diagram...</div>'),
          }}
        />
      )}
      <button
        onClick={() => setShowRaw(!showRaw)}
        className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        type="button"
      >
        {showRaw ? 'Show Diagram' : 'Show Raw Code'}
      </button>
    </div>
  );
};
