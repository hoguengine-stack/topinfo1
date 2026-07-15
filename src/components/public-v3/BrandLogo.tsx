import React from "react";

interface BrandLogoProps {
  onClick?: () => void;
  inverse?: boolean;
  compact?: boolean;
}

export function BrandLogo({ onClick, inverse = false, compact = false }: BrandLogoProps) {
  const content = (
    <>
      <span className="brand-logo__mark" aria-hidden="true">T</span>
      {!compact && (
        <span className="brand-logo__wordmark">
          <strong className={inverse ? "text-white" : "text-[#101828]"}>탑 정보통신</strong>
          <small>TOP INFO &amp; COMM</small>
        </span>
      )}
    </>
  );

  if (!onClick) {
    return <div className="brand-logo" aria-label="탑정보통신">{content}</div>;
  }

  return (
    <button type="button" className="brand-logo" onClick={onClick} aria-label="탑정보통신 홈으로 이동">
      {content}
    </button>
  );
}
