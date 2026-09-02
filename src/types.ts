export type Priority = "긴급" | "높음" | "보통" | "낮음";
export type Status = "예정" | "진행 중" | "완료" | "대기 중";
export type TaskType = "용지" | "설치" | "점검" | "수리" | "휴대용단말기" | "기타";
export type PublicMediaRightsStatus = "verified" | "pending" | "internal_only";

export interface Task {
  id: string;
  title: string;
  status: Status;
  assignee: string;
  assigneeId?: string;
  dueDate: string; // YYYY-MM-DD
  visitTime?: string; // HH:mm
  priority: Priority;
  taskType: TaskType;
  description: string;
  memo?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  showOnCalendar?: boolean;
  attachments?: string[];
  sourceCollection?: "consultations" | "paper_requests";
  sourceId?: string;
  sourceType?: "consultation" | "paper_request";
}

export interface StaffAssignee {
  id?: string;
  name: string;
  jobTitle?: string;
}

export type ProductCategory = "포스" | "단말기" | "키오스크" | "주변기기" | "통신" | "보안" | "기타";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  features: string[];
  specs: Record<string, string>;
  imageUrl: string;
  imageSourceUrl?: string;
  imageRightsStatus?: PublicMediaRightsStatus;
  price?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  customerName: string;
  contact: string;
  businessName?: string;
  businessType?: string;
  projectType?: string;
  installRegion?: string;
  preferredTiming?: string;
  productOfInterest?: string;
  message: string;
  status: "대기" | "작업등록" | "완료";
  createdAt: string;
  privacyConsentAt?: string;
  overseasTransferConsentAt?: string;
  privacyPolicyVersion?: string;
  linkedTaskId?: string;
  taskLinkedAt?: string;
  taskLinkedBy?: string;
}

export interface PaperRequest {
  id: string;
  customerName: string;
  contact: string;
  address: string;
  deviceModel?: string;
  quantity: string;
  status: "대기" | "작업등록" | "완료";
  createdAt: string;
  privacyConsentAt?: string;
  overseasTransferConsentAt?: string;
  privacyPolicyVersion?: string;
  linkedTaskId?: string;
  taskLinkedAt?: string;
  taskLinkedBy?: string;
}

export interface Suggestion {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId?: string;
  isSecret: boolean;
  replies?: Comment[];
  createdAt: string;
  privacyConsentAt?: string;
  overseasTransferConsentAt?: string;
  privacyPolicyVersion?: string;
}

export interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  description: string;
  downloadUrl?: string;
  fileSize?: string;
  fileType?: string;
  createdAt: string;
  authorName: string;
  authorId?: string;
}

export interface CMSSectorFeature {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  staticImageUrl?: string;
  imageSourceUrl?: string;
  imageRightsStatus?: PublicMediaRightsStatus;
  tone?: "blue" | "mint" | "coral" | "violet" | "amber" | "neutral";
  size?: "standard" | "wide";
}

export interface CMSSectorFeatureGroup {
  id: string;
  title: string;
  subtitle?: string;
  features: CMSSectorFeature[];
}

export interface CMSMediaPlaylistItem {
  imageUrl: string;
  staticImageUrl?: string;
  imageSourceUrl?: string;
  imageRightsStatus?: PublicMediaRightsStatus;
  imageAlt?: string;
  caption?: string;
  durationMs?: number;
}

export interface CMSBlock {
  id: string;
  type: "hero" | "features" | "text" | "columns" | "banner" | "image" | "divider" | "custom_board";
  boardPart?: "header" | "search" | "body";
  title?: string;
  subtitle?: string;
  content?: string;
  note?: string;
  priceLabel?: string;
  priceValue?: string;
  priceUnit?: string;
  priceDetails?: string;
  listLabel?: string;
  imageCaption?: string;
  imageUrl?: string;
  imageSourceUrl?: string;
  imageRightsStatus?: PublicMediaRightsStatus;
  align?: "left" | "center" | "right";
  titleAlign?: "left" | "center" | "right";
  subtitleAlign?: "left" | "center" | "right";
  badgeAlign?: "left" | "center" | "right";
  contentAlign?: "left" | "center" | "right";
  buttonsAlign?: "left" | "center" | "right";
  buttonText?: string;
  buttonLink?: string;
  badge?: string;
  badgeIconUrl?: string | null;
  gridCols?: number | string;
  itemLayout?: string;
  cardBgColor?: string;
  titleSize?: string;
  titleColor?: string;
  titleFontSize?: string;
  titleLetterSpacing?: string;
  subtitleSize?: string;
  subtitleColor?: string;
  subtitleFontSize?: string;
  subtitleLetterSpacing?: string;
  contentSize?: string;
  contentColor?: string;
  contentFontSize?: string;
  contentLetterSpacing?: string;
  textBoxWidth?: string;
  textBoxHeight?: string;
  layoutStyle?: string;
  bgColor?: string;
  button2Text?: string;
  button2Link?: string;
  blockWidth?: string;
  blockAlign?: string;
  innerAlign?: string;
  innerSnap?: boolean;
  posX?: number;
  posY?: number;
  elementOrder?: string[];
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonRoundness?: string;
  buttonWidth?: string;
  buttonHeight?: string;
  buttonFontSize?: string;
  buttonLetterSpacing?: string;
  button2BgColor?: string;
  button2TextColor?: string;
  button2Roundness?: string;
  button2Width?: string;
  button2Height?: string;
  button2FontSize?: string;
  button2LetterSpacing?: string;
  bannerLayout?: "text-only" | "side-image" | "bg-image" | "inline" | "watermark" | "offer";
  bannerImagePosition?: "left" | "right" | "top" | "bottom";
  iconImageUrl?: string;
  iconRoundness?: string;
  imageWidth?: string;
  imageHeight?: string;
  imageMarginTop?: string;
  imageMarginBottom?: string;
  imageRoundness?: string;
  imagePositionX?: string;
  imagePositionY?: string;
  imageRotation?: string;
  iconWidth?: string;
  iconHeight?: string;
  iconMarginTop?: string;
  iconMarginBottom?: string;
  iconPositionX?: string;
  iconPositionY?: string;
  elementSizes?: Record<string, { width?: string; height?: string; fontSize?: string; scale?: number }>;
  items?: {
    title: string;
    desc: string;
    icon?: string;
    iconBg?: string;
    iconColor?: string;
    badge?: string;
    badgeBg?: string;
    badgeColor?: string;
    titleSize?: string;
    titleColor?: string;
    descSize?: string;
    descColor?: string;
    buttonText?: string;
    buttonLink?: string;
    imageUrl?: string;
    imageAlt?: string;
    staticImageUrl?: string;
    imageSourceUrl?: string;
    imageRightsStatus?: PublicMediaRightsStatus;
    mediaKind?: "pos" | "internet" | "ai" | "cctv" | "phone" | "other";
    mediaPlaylist?: CMSMediaPlaylistItem[];
    detailGroups?: CMSSectorFeatureGroup[];
  }[];
}

export interface CMSPage {
  id: string;
  title: string;
  slug: string;
  blocks: CMSBlock[];
  draftBlocks?: CMSBlock[];
  isCustom: boolean;
  createdAt: string;
  designVersion?: number;
  customBoardInitialized?: boolean;
}

export interface NavigationItemSettings {
  label?: string;
  visible?: boolean;
  order?: number;
}

export type NavigationSettings = Record<string, NavigationItemSettings>;
