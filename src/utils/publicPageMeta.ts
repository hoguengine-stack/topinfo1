import type { CMSPage } from "../types";
import { STANDARD_PUBLIC_ROUTES } from "./publicRoutes";

export interface PublicPageMeta {
  title: string;
  description: string;
}

const PUBLIC_PAGE_META: Record<string, PublicPageMeta> = Object.fromEntries(
  STANDARD_PUBLIC_ROUTES.map(({ slug, title, description }) => [slug, { title, description }]),
);

const DEFAULT_PUBLIC_PAGE_META = PUBLIC_PAGE_META.home;

function normalizeMetaText(value?: string): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function getPageDescription(page: CMSPage): string {
  const source = page.blocks.find((block) => normalizeMetaText(block.subtitle))?.subtitle
    || page.blocks.find((block) => normalizeMetaText(block.content))?.content;
  const description = normalizeMetaText(source);

  if (!description) return DEFAULT_PUBLIC_PAGE_META.description;
  return description.length <= 160 ? description : `${description.slice(0, 157).trimEnd()}...`;
}

export function getPublicPageMeta(slug: string, page?: CMSPage): PublicPageMeta {
  const configured = PUBLIC_PAGE_META[slug];
  if (configured) return configured;

  const pageTitle = normalizeMetaText(page?.title);
  return {
    title: pageTitle ? `${pageTitle} | 탑정보통신` : DEFAULT_PUBLIC_PAGE_META.title,
    description: page ? getPageDescription(page) : DEFAULT_PUBLIC_PAGE_META.description,
  };
}
