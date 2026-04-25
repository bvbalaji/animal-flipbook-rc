declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'react-pageflip' {
  import { Component, ReactNode, CSSProperties, Ref } from 'react';

  // The imperative API exposed via ref
  interface PageFlipAPI {
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
  }

  // All props accepted by HTMLFlipBook
  interface HTMLFlipBookProps {
    // Required
    width: number;
    height: number;
    children: ReactNode;
    // Layout
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    autoSize?: boolean;
    // Behaviour
    startPage?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    // Styling
    className?: string;
    style?: CSSProperties;
    // Events
    onFlip?: (e: { data: number }) => void;
    onChangeOrientation?: (e: { data: string }) => void;
    onChangeState?: (e: { data: string }) => void;
    onInit?: (e: { data: number }) => void;
    onUpdate?: (e: { data: number }) => void;
  }

  // The class declaration — merges Component with the pageFlip() instance method
  // so that refs typed as HTMLFlipBook expose pageFlip()
  class HTMLFlipBook extends Component<HTMLFlipBookProps> {
    pageFlip(): PageFlipAPI;
  }

  export default HTMLFlipBook;
}
