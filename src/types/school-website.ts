// src/types/school-website.ts
// All types for the school public website feature.
// These are stored per-school in the SchoolWebsite table and served
// to the Next.js dynamic route renderer.

// ---------------------------------------------------------------------------
// THEME / TEMPLATE
// ---------------------------------------------------------------------------

export type TemplateId =
  | 'prestige'    // Deep navy + gold. Formal, established. Best for older private schools.
  | 'horizon'     // Clean white + forest green. Modern, fresh. Best for newer schools.
  | 'legacy'      // Warm cream + burgundy. Classic, authoritative. Best for secondary schools.
  | 'bold'        // Black + vibrant orange. Energetic, confident. Best for STEM-focused schools.
  | 'serene'      // Soft blue + white. Calm, trustworthy. Best for nursery/primary schools.
  | 'mosaic';     // Earthy terracotta + gold. Afrocentric, warm. Best for culturally rooted schools.

export interface ThemeColors {
  primary: string;       // Main brand color (hex)
  secondary: string;     // Accent color (hex)
  background: string;    // Page background (hex)
  surface: string;       // Card/section background (hex)
  text: string;          // Body text (hex)
  textLight: string;     // Muted text (hex)
  border: string;        // Border color (hex)
}

export interface ThemeTypography {
  displayFont: string;   // Google Fonts name for headings
  bodyFont: string;      // Google Fonts name for body text
}

export interface Template {
  id: TemplateId;
  name: string;
  description: string;
  previewImageUrl: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  tags: string[];
}

// ---------------------------------------------------------------------------
// SCHOOL WEBSITE CONFIG
// Stored in DB. Everything the template renderer needs.
// ---------------------------------------------------------------------------

export interface SchoolContact {
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  whatsapp?: string;
  googleMapsUrl?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

export interface HeroSection {
  headline: string;           // e.g. "Shaping Tomorrow's Leaders Today"
  subheadline: string;        // e.g. "A premier private school in the heart of Lagos"
  ctaText: string;            // e.g. "Apply for 2026/2027 Session"
  ctaLink: string;            // e.g. "/admissions"
  backgroundImageUrl?: string;
  showStats: boolean;
}

export interface SchoolStat {
  label: string;   // e.g. "Years of Excellence"
  value: string;   // e.g. "25+"
}

export interface AboutSection {
  mission: string;
  vision: string;
  story: string;     // Rich text / paragraphs
  foundedYear?: number;
  stats: SchoolStat[];
  imageUrl?: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption?: string;
  category: 'academics' | 'sports' | 'events' | 'facilities' | 'graduation';
}

export interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;   // Markdown or HTML
  coverImageUrl?: string;
  publishedAt: string;  // ISO date string
  author: string;
  slug: string;
  isPublished: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  imageUrl?: string;
  bio?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;   // e.g. "Parent, JSS 2"
  avatarUrl?: string;
  isActive: boolean;
}

export interface AdmissionsConfig {
  isOpen: boolean;
  sessionLabel: string;         // e.g. "2026/2027 Academic Session"
  applicationFeeNaira: number;  // 0 = free
  requiresPayment: boolean;
  availableClasses: string[];   // e.g. ["JSS 1", "JSS 2", "SS 1 Science"]
  requirements: string[];       // e.g. ["Birth certificate", "Last school report card"]
  deadline?: string;            // ISO date or null
  paystackPublicKey: string;    // Scoped to the school (or SchoolOS master key)
  customFields: AdmissionCustomField[];
}

export interface AdmissionCustomField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'file' | 'date' | 'textarea';
  options?: string[];   // For select type
  required: boolean;
}

export interface SchoolWebsiteConfig {
  schoolId: string;
  slug: string;                   // URL slug: victoryacademy.schoolos.ng/[slug] or custom domain
  customDomain?: string;          // e.g. www.victoryacademy.edu.ng
  customDomainVerified: boolean;

  // Identity
  schoolName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;

  // Template
  templateId: TemplateId;

  // Pages
  hero: HeroSection;
  about: AboutSection;
  gallery: GalleryImage[];
  news: NewsPost[];
  staff: StaffMember[];
  testimonials: Testimonial[];
  admissions: AdmissionsConfig;
  contact: SchoolContact;
  social: SocialLinks;

  // SEO
  metaDescription?: string;
  ogImageUrl?: string;

  // Status
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// ADMISSIONS FORM SUBMISSION
// Stored per application. Linked to SchoolWebsite + Admissions module.
// ---------------------------------------------------------------------------

export interface AdmissionApplication {
  id: string;
  schoolId: string;
  sessionLabel: string;

  // Student details
  studentFirstName: string;
  studentLastName: string;
  studentDob: string;
  studentGender: 'male' | 'female';
  classApplyingFor: string;
  previousSchool?: string;

  // Parent/Guardian
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentRelationship: string;
  parentAddress: string;

  // Custom fields (school-defined)
  customFieldValues: Record<string, string>;

  // Documents
  uploadedDocumentUrls: string[];

  // Payment
  applicationFeeNaira: number;
  paymentStatus: 'pending' | 'paid' | 'waived';
  paystackReference?: string;
  paidAt?: string;

  // Status
  applicationStatus: 'submitted' | 'under_review' | 'offered' | 'rejected' | 'enrolled';
  submittedAt: string;
  notes?: string;   // Admin notes
}

// ---------------------------------------------------------------------------
// TEMPLATE DEFINITIONS
// ---------------------------------------------------------------------------

export const TEMPLATES: Template[] = [
  {
    id: 'prestige',
    name: 'Prestige',
    description: 'Deep navy and gold. Formal and established. Projects authority and tradition.',
    previewImageUrl: '/templates/prestige-preview.jpg',
    colors: {
      primary: '#0A1628',
      secondary: '#C9A84C',
      background: '#F8F7F4',
      surface: '#FFFFFF',
      text: '#0A1628',
      textLight: '#6B7280',
      border: '#E5E1D8',
    },
    typography: {
      displayFont: 'Playfair Display',
      bodyFont: 'Source Serif 4',
    },
    tags: ['formal', 'secondary', 'established'],
  },
  {
    id: 'horizon',
    name: 'Horizon',
    description: 'Clean white and forest green. Modern and fresh. Projects growth and ambition.',
    previewImageUrl: '/templates/horizon-preview.jpg',
    colors: {
      primary: '#1A4731',
      secondary: '#E8F5E0',
      background: '#FAFAFA',
      surface: '#FFFFFF',
      text: '#111827',
      textLight: '#6B7280',
      border: '#E5E7EB',
    },
    typography: {
      displayFont: 'DM Serif Display',
      bodyFont: 'DM Sans',
    },
    tags: ['modern', 'fresh', 'secondary', 'primary'],
  },
  {
    id: 'legacy',
    name: 'Legacy',
    description: 'Warm cream and burgundy. Classic and authoritative. For schools with heritage.',
    previewImageUrl: '/templates/legacy-preview.jpg',
    colors: {
      primary: '#6B1D1D',
      secondary: '#C9A84C',
      background: '#FAF7F2',
      surface: '#FFFFFF',
      text: '#1C1C1C',
      textLight: '#6B6B6B',
      border: '#E8DFD0',
    },
    typography: {
      displayFont: 'Cormorant Garamond',
      bodyFont: 'Lato',
    },
    tags: ['classic', 'secondary', 'heritage'],
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Black and vibrant orange. Energetic and confident. For forward-thinking schools.',
    previewImageUrl: '/templates/bold-preview.jpg',
    colors: {
      primary: '#0F0F0F',
      secondary: '#F97316',
      background: '#0F0F0F',
      surface: '#1A1A1A',
      text: '#F5F5F5',
      textLight: '#A3A3A3',
      border: '#2A2A2A',
    },
    typography: {
      displayFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    tags: ['dark', 'energetic', 'STEM', 'modern'],
  },
  {
    id: 'serene',
    name: 'Serene',
    description: 'Soft blue and white. Calm and trustworthy. Perfect for nursery and primary schools.',
    previewImageUrl: '/templates/serene-preview.jpg',
    colors: {
      primary: '#1E40AF',
      secondary: '#DBEAFE',
      background: '#F0F7FF',
      surface: '#FFFFFF',
      text: '#1E3A5F',
      textLight: '#64748B',
      border: '#BFDBFE',
    },
    typography: {
      displayFont: 'Nunito',
      bodyFont: 'Nunito',
    },
    tags: ['friendly', 'nursery', 'primary', 'bright'],
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    description: 'Earthy terracotta and gold. Warm and culturally rooted. Distinctly Nigerian.',
    previewImageUrl: '/templates/mosaic-preview.jpg',
    colors: {
      primary: '#8B3A2A',
      secondary: '#D4A843',
      background: '#FDF6EE',
      surface: '#FFFFFF',
      text: '#2C1810',
      textLight: '#7A6558',
      border: '#E8D5C0',
    },
    typography: {
      displayFont: 'Fraunces',
      bodyFont: 'Crimson Pro',
    },
    tags: ['afrocentric', 'warm', 'cultural', 'secondary'],
  },
];

export function getTemplate(id: TemplateId): Template {
  const t = TEMPLATES.find(t => t.id === id);
  if (!t) throw new Error(`Unknown template: ${id}`);
  return t;
}
