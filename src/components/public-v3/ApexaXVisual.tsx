import React from "react";

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

  return (
    <div className={`apexa-x-visual is-${variant} ${className}`.trim()}>
      {showsCounterSet && (
        <img
          className="apexa-x-visual__cash-drawer"
          src="/assets/product/white-cash-drawer.png"
          alt=""
          aria-hidden="true"
          loading={eager ? "eager" : "lazy"}
        />
      )}
      <div className="apexa-x-visual__pos">
        <img
          className="apexa-x-visual__base"
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={eager ? "high" : undefined}
        />
        {needsScreenOverlay && (
          <img
            className="apexa-x-visual__screen"
            src="/assets/product/toss-pos-screen-verified.png"
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
            alt=""
            aria-hidden="true"
            loading={eager ? "eager" : "lazy"}
          />
          <img
            className="apexa-x-visual__front"
            src="/assets/product/toss-front.webp"
            alt=""
            aria-hidden="true"
            loading={eager ? "eager" : "lazy"}
          />
        </>
      )}
    </div>
  );
}
