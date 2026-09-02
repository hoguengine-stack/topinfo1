import React from "react";

const TOSS_POS_PUBLIC_SCREEN = "/assets/product/toss-pos-screen.webp";

interface IntrinsicImageSize {
  width: number;
  height: number;
}

const PRODUCT_IMAGE_SIZES: Record<string, IntrinsicImageSize> = {
  "/assets/product/posbank-apexa-x-white-official.png": { width: 1200, height: 800 },
};

const TOSS_POS_SCREEN_SIZE = { width: 768, height: 552 } as const;
const CASH_DRAWER_SIZE = { width: 1302, height: 506 } as const;
const RECEIPT_PRINTER_SIZE = { width: 381, height: 378 } as const;
const TOSS_FRONT_SIZE = { width: 1400, height: 1400 } as const;

function getIntrinsicImageSize(src: string): IntrinsicImageSize | undefined {
  return PRODUCT_IMAGE_SIZES[src.split(/[?#]/, 1)[0]];
}

export type ApexaXVisualVariant = "product" | "counter-set" | "system-pos" | "system-internet" | "retail";

interface ApexaXVisualProps {
  src: string;
  alt: string;
  variant: ApexaXVisualVariant;
  className?: string;
  eager?: boolean;
}

export function ApexaXVisual({ src, alt, variant, className = "", eager = false }: ApexaXVisualProps) {
  const needsScreenOverlay = src.includes("posbank-apexa-x-white-official");
  const showsCounterSet = variant === "counter-set";
  const baseImageSize = getIntrinsicImageSize(src);

  return (
    <div className={`apexa-x-visual is-${variant} ${className}`.trim()}>
      {showsCounterSet && (
        <img
          className="apexa-x-visual__cash-drawer"
          src="/assets/product/white-cash-drawer.png"
          width={CASH_DRAWER_SIZE.width}
          height={CASH_DRAWER_SIZE.height}
          alt=""
          aria-hidden="true"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      )}
      <div className="apexa-x-visual__pos">
        <img
          className="apexa-x-visual__base"
          src={src}
          width={baseImageSize?.width}
          height={baseImageSize?.height}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
        />
        {needsScreenOverlay && (
          <img
            className="apexa-x-visual__screen"
            src={TOSS_POS_PUBLIC_SCREEN}
            width={TOSS_POS_SCREEN_SIZE.width}
            height={TOSS_POS_SCREEN_SIZE.height}
            alt=""
            aria-hidden="true"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
        )}
      </div>
      {showsCounterSet && (
        <>
          <img
            className="apexa-x-visual__printer"
            src="/assets/product/ahapos-white-printer.png"
            width={RECEIPT_PRINTER_SIZE.width}
            height={RECEIPT_PRINTER_SIZE.height}
            alt=""
            aria-hidden="true"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
          <img
            className="apexa-x-visual__front"
            src="/assets/product/toss-front.webp"
            width={TOSS_FRONT_SIZE.width}
            height={TOSS_FRONT_SIZE.height}
            alt=""
            aria-hidden="true"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
        </>
      )}
    </div>
  );
}
