import { CMSPage, Product, PublicMediaRightsStatus } from "../types";
import { getBlockedPublicMediaReason, getProjectMediaPublicationRecord } from "./publicMedia";

export interface CMSMediaAuditIssue {
  location: string;
  imageUrl: string;
  reason: string;
}

function isRegisteredProjectAsset(imageUrl: string) {
  return imageUrl.startsWith("/assets/");
}

function auditMedia(
  issues: CMSMediaAuditIssue[],
  location: string,
  imageUrl?: string,
  imageSourceUrl?: string,
  imageRightsStatus?: PublicMediaRightsStatus,
) {
  const value = imageUrl?.trim();
  if (!value) return;

  const blockedReason = getBlockedPublicMediaReason(value);
  if (blockedReason) {
    issues.push({ location, imageUrl: value, reason: `공개 차단 자산입니다. ${blockedReason}` });
    return;
  }

  if (isRegisteredProjectAsset(value)) {
    const projectRecord = getProjectMediaPublicationRecord(value);
    if (projectRecord?.rightsStatus === "verified") return;
    if (projectRecord) {
      issues.push({
        location,
        imageUrl: value,
        reason: `프로젝트 자산의 공개 사용권 상태가 '확인 필요'입니다. ${projectRecord.reason}`,
      });
      return;
    }
  }

  if (/^(data|blob):/i.test(value)) {
    issues.push({ location, imageUrl: value, reason: "임시 data/blob 이미지는 공개할 수 없습니다." });
    return;
  }

  if (!imageSourceUrl?.trim()) {
    issues.push({ location, imageUrl: value, reason: "원본 출처 URL 또는 파트너 원본 식별자가 없습니다." });
  }

  if (imageRightsStatus !== "verified") {
    issues.push({ location, imageUrl: value, reason: "공개 사용권 상태가 '확인 완료'가 아닙니다." });
  }
}

export function auditProductMediaForPublication(products: Product[]) {
  const issues: CMSMediaAuditIssue[] = [];
  products.forEach((product) => {
    auditMedia(
      issues,
      `제품 > ${product.name}`,
      product.imageUrl,
      product.imageSourceUrl,
      product.imageRightsStatus,
    );
  });
  return issues;
}

export function auditCMSMediaForPublication(pages: CMSPage[], products: Product[] = []) {
  const issues: CMSMediaAuditIssue[] = [];

  pages.forEach((page) => {
    page.blocks.forEach((block, blockIndex) => {
      const blockLocation = `${page.title} > ${block.title || `섹션 ${blockIndex + 1}`}`;
      auditMedia(issues, `${blockLocation} > 대표 이미지`, block.imageUrl, block.imageSourceUrl, block.imageRightsStatus);
      auditMedia(issues, `${blockLocation} > 배지 아이콘`, block.badgeIconUrl || undefined, block.imageSourceUrl, block.imageRightsStatus);
      auditMedia(issues, `${blockLocation} > 아이콘 이미지`, block.iconImageUrl, block.imageSourceUrl, block.imageRightsStatus);

      block.items?.forEach((item, itemIndex) => {
        const itemLocation = `${blockLocation} > ${item.title || `항목 ${itemIndex + 1}`}`;
        auditMedia(issues, `${itemLocation} > 이미지`, item.imageUrl, item.imageSourceUrl, item.imageRightsStatus);
        auditMedia(issues, `${itemLocation} > 정지 이미지`, item.staticImageUrl, item.imageSourceUrl, item.imageRightsStatus);

        item.mediaPlaylist?.forEach((media, mediaIndex) => {
          const mediaLocation = `${itemLocation} > 장면 ${mediaIndex + 1}`;
          auditMedia(issues, mediaLocation, media.imageUrl, media.imageSourceUrl, media.imageRightsStatus);
          auditMedia(issues, `${mediaLocation} 정지 이미지`, media.staticImageUrl, media.imageSourceUrl, media.imageRightsStatus);
        });

        item.detailGroups?.forEach((group) => {
          group.features.forEach((feature) => {
            const featureLocation = `${itemLocation} > ${group.title} > ${feature.title}`;
            auditMedia(issues, featureLocation, feature.imageUrl, feature.imageSourceUrl, feature.imageRightsStatus);
            auditMedia(issues, `${featureLocation} 정지 이미지`, feature.staticImageUrl, feature.imageSourceUrl, feature.imageRightsStatus);
          });
        });
      });
    });
  });

  return [...issues, ...auditProductMediaForPublication(products)];
}
