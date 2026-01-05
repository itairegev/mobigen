'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useVisualEditor } from '../../hooks/useVisualEditor';
import type { SelectedElement } from '../../stores/visual-editor';

interface PreviewSyncProps {
  projectId: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
  onElementSelect?: (element: SelectedElement) => void;
}

// Message types for iframe communication
interface IframeMessage {
  type: 'element-clicked' | 'element-hovered' | 'element-unhovered' | 'ready' | 'style-updated';
  payload?: SelectedElement | { success: boolean };
}

/**
 * Preview Sync - handles communication between the dashboard and the preview iframe
 * Manages element selection, hover states, and real-time style updates
 */
export function PreviewSync({ projectId, iframeRef, onElementSelect }: PreviewSyncProps) {
  const { isDesignMode, selectElement, hoverElement, setSyncing, setPreviewUrl, pendingChanges } =
    useVisualEditor();
  const isIframeReady = useRef(false);

  // Inject design mode script into iframe when it loads
  const injectDesignModeScript = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      const script = `
        (function() {
          if (window.__mobigenDesignMode) return;
          window.__mobigenDesignMode = true;

          let lastHoveredElement = null;

          function getElementInfo(el) {
            const rect = el.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(el);

            // Determine element type
            let type = 'container';
            if (el.tagName === 'IMG') type = 'image';
            else if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') type = 'button';
            else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') type = 'input';
            else if (el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) type = 'text';

            // Extract relevant styles
            const styles = {
              color: computedStyle.color,
              backgroundColor: computedStyle.backgroundColor,
              fontSize: computedStyle.fontSize,
              fontWeight: computedStyle.fontWeight,
              padding: computedStyle.padding,
              margin: computedStyle.margin,
              borderWidth: computedStyle.borderWidth,
              borderColor: computedStyle.borderColor,
              borderRadius: computedStyle.borderRadius,
            };

            return {
              id: el.dataset.mobigenId || el.id || 'element-' + Math.random().toString(36).substr(2, 9),
              type: type,
              path: el.dataset.mobigenPath || '',
              line: parseInt(el.dataset.mobigenLine || '0', 10),
              content: type === 'text' ? el.textContent : (type === 'image' ? el.src : ''),
              styles: styles,
              bounds: {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
              },
            };
          }

          function handleClick(e) {
            if (!window.__mobigenDesignModeActive) return;
            e.preventDefault();
            e.stopPropagation();

            const element = e.target;
            const info = getElementInfo(element);

            window.parent.postMessage({
              type: 'element-clicked',
              payload: info,
            }, '*');
          }

          function handleMouseOver(e) {
            if (!window.__mobigenDesignModeActive) return;
            if (e.target === lastHoveredElement) return;
            lastHoveredElement = e.target;

            const info = getElementInfo(e.target);
            window.parent.postMessage({
              type: 'element-hovered',
              payload: info,
            }, '*');
          }

          function handleMouseOut(e) {
            if (!window.__mobigenDesignModeActive) return;
            if (e.target === lastHoveredElement) {
              lastHoveredElement = null;
              window.parent.postMessage({
                type: 'element-unhovered',
                payload: null,
              }, '*');
            }
          }

          document.addEventListener('click', handleClick, true);
          document.addEventListener('mouseover', handleMouseOver, true);
          document.addEventListener('mouseout', handleMouseOut, true);

          // Listen for messages from parent
          window.addEventListener('message', function(e) {
            if (e.data.type === 'enable-design-mode') {
              window.__mobigenDesignModeActive = true;
              document.body.style.cursor = 'crosshair';
            } else if (e.data.type === 'disable-design-mode') {
              window.__mobigenDesignModeActive = false;
              document.body.style.cursor = '';
            } else if (e.data.type === 'apply-style') {
              // Find element and apply style
              const { elementId, property, value } = e.data.payload;
              const el = document.querySelector('[data-mobigen-id="' + elementId + '"]') ||
                        document.getElementById(elementId);
              if (el) {
                el.style[property] = value;
                window.parent.postMessage({
                  type: 'style-updated',
                  payload: { success: true },
                }, '*');
              }
            }
          });

          // Signal ready
          window.parent.postMessage({ type: 'ready' }, '*');
        })();
      `;

      // Create a script element and inject it into the iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        const scriptEl = iframeDoc.createElement('script');
        scriptEl.textContent = script;
        iframeDoc.head.appendChild(scriptEl);
      }
    } catch (error) {
      console.error('Failed to inject design mode script:', error);
    }
  }, [iframeRef]);

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent<IframeMessage>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'ready':
          isIframeReady.current = true;
          if (isDesignMode) {
            iframeRef.current?.contentWindow?.postMessage({ type: 'enable-design-mode' }, '*');
          }
          break;

        case 'element-clicked':
          if (payload && 'id' in payload) {
            selectElement(payload);
            onElementSelect?.(payload);
          }
          break;

        case 'element-hovered':
          if (payload && 'id' in payload) {
            hoverElement(payload);
          }
          break;

        case 'element-unhovered':
          hoverElement(null);
          break;

        case 'style-updated':
          setSyncing(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeRef, isDesignMode, selectElement, hoverElement, setSyncing, onElementSelect]);

  // Toggle design mode in iframe
  useEffect(() => {
    if (!isIframeReady.current) return;

    iframeRef.current?.contentWindow?.postMessage(
      { type: isDesignMode ? 'enable-design-mode' : 'disable-design-mode' },
      '*'
    );
  }, [isDesignMode, iframeRef]);

  // Inject script when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      injectDesignModeScript();
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [iframeRef, injectDesignModeScript]);

  // Send style updates to iframe
  useEffect(() => {
    if (pendingChanges.length === 0) return;

    const latestChange = pendingChanges[pendingChanges.length - 1];
    if (latestChange.type === 'style') {
      setSyncing(true);

      const [property, value] = Object.entries(latestChange.after)[0];
      iframeRef.current?.contentWindow?.postMessage(
        {
          type: 'apply-style',
          payload: {
            elementId: latestChange.elementId,
            property,
            value,
          },
        },
        '*'
      );
    }
  }, [pendingChanges, iframeRef, setSyncing]);

  return null; // This is a behavior-only component
}

export default PreviewSync;
