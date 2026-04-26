declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module 'react-pageflip' {
  import { Component, ReactNode, CSSProperties } from 'react';

  interface HTMLFlipBookProps {
    width: number;
    height: number;
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    startPage?: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    drawShadow?: boolean;
    flippingTime?: number;
    usePortrait?: boolean;
    startZIndex?: number;
    autoSize?: boolean;
    maxShadowOpacity?: number;
    showCover?: boolean;
    mobileScrollSupport?: boolean;
    clickEventForward?: boolean;
    useMouseEvents?: boolean;
    swipeDistance?: number;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    onFlip?: (e: { data: number }) => void;
    onChangeOrientation?: (e: { data: string }) => void;
    onChangeState?: (e: { data: string }) => void;
    onInit?: (e: { data: number }) => void;
    onUpdate?: (e: { data: number }) => void;
    ref?: React.Ref<HTMLFlipBookInstance>;
  }

  interface HTMLFlipBookInstance {
    pageFlip(): {
      flipNext(corner?: 'top' | 'bottom'): void;
      flipPrev(corner?: 'top' | 'bottom'): void;
      flip(page: number, corner?: 'top' | 'bottom'): void;
      getCurrentPageIndex(): number;
      getPageCount(): number;
    };
  }

  class HTMLFlipBook extends Component<HTMLFlipBookProps> {
    pageFlip(): {
      flipNext(corner?: 'top' | 'bottom'): void;
      flipPrev(corner?: 'top' | 'bottom'): void;
      flip(page: number, corner?: 'top' | 'bottom'): void;
      getCurrentPageIndex(): number;
      getPageCount(): number;
    };
  }
  export default HTMLFlipBook;
}
