// src/lib/school-website-api.ts
// Data access layer for school public website config.
// In production this hits the SchoolOS API (or Prisma directly if co-located).
// During development, falls back to mock data so the UI works without a DB.

import type { SchoolWebsiteConfig } from '@/types/school-website';

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.schoolos.ng';

// ---------------------------------------------------------------------------
// FETCH SCHOOL CONFIG (public, no auth)
// ---------------------------------------------------------------------------

export async function getSchoolWebsiteConfig(
  slugOrDomain: string,
): Promise<SchoolWebsiteConfig | null> {
  if (import.meta.env.DEV) {
    return getMockConfig(slugOrDomain);
  }

  try {
    const res = await fetch(`${API_BASE}/public/schools/${slugOrDomain}/website`);
    if (!res.ok) return null;
    return res.json() as Promise<SchoolWebsiteConfig>;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// SUBMIT ADMISSION APPLICATION (public)
// ---------------------------------------------------------------------------

export async function submitAdmissionApplication(
  schoolSlug: string,
  formData: FormData,
): Promise<{ success: boolean; applicationId?: string; error?: string; paystackReference?: string }> {
  try {
    const res = await fetch(`${API_BASE}/public/schools/${schoolSlug}/admissions`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  } catch {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// ---------------------------------------------------------------------------
// VERIFY APPLICATION PAYMENT
// ---------------------------------------------------------------------------

export async function verifyApplicationPayment(
  schoolSlug: string,
  reference: string,
): Promise<{ verified: boolean; applicationId?: string }> {
  try {
    const res = await fetch(
      `${API_BASE}/public/schools/${schoolSlug}/admissions/verify-payment?reference=${reference}`,
    );
    return res.json();
  } catch {
    return { verified: false };
  }
}

// ---------------------------------------------------------------------------
// MOCK DATA (development only)
// ---------------------------------------------------------------------------

function getMockConfig(slug: string): SchoolWebsiteConfig {
  return {
    schoolId: 'mock-school-001',
    slug,
    customDomain: undefined,
    customDomainVerified: false,
    schoolName: 'Victory Heights Academy',
    tagline: 'Shaping Tomorrow\'s Leaders Today',
    logoUrl: undefined,
    faviconUrl: undefined,
    templateId: 'prestige',
    hero: {
      headline: 'Excellence is Our\nStandard',
      subheadline: 'A premier private school nurturing academic brilliance, strong character, and lifelong achievement in the heart of Lagos.',
      ctaText: 'Apply for 2026/2027 Session',
      ctaLink: '?page=admissions',
      showStats: true,
    },
    about: {
      mission: 'To provide world-class education that empowers every student to discover their potential, develop critical thinking, and become responsible leaders in Nigeria and beyond.',
      vision: 'To be the most respected private secondary school in West Africa, known for academic excellence, strong values, and outstanding graduates.',
      story: 'Founded in 2001, Victory Heights Academy began with 47 students and a single classroom block in Lekki. Twenty-five years later, we are home to over 800 students, 120 qualified teachers, and alumni in leading universities across Nigeria, the UK, and the United States.',
      foundedYear: 2001,
      stats: [
        { label: 'Years of Excellence', value: '25+' },
        { label: 'Students Enrolled', value: '800+' },
        { label: 'WAEC A1 Rate', value: '94%' },
        { label: 'Alumni in Abroad Unis', value: '200+' },
      ],
      imageUrl: undefined,
    },
    gallery: [
      { id: 'g1', url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800', caption: 'Science Laboratory', category: 'facilities' },
      { id: 'g2', url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=800', caption: 'Annual Sports Day 2025', category: 'sports' },
      { id: 'g3', url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800', caption: 'SS3 Graduation 2025', category: 'graduation' },
      { id: 'g4', url: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800', caption: 'Library and Study Hall', category: 'facilities' },
      { id: 'g5', url: 'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800', caption: 'Inter-House Quiz Competition', category: 'academics' },
      { id: 'g6', url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800', caption: 'Cultural Day 2025', category: 'events' },
    ],
    news: [
      {
        id: 'n1',
        title: '94% of SS3 Students Score A1-C6 in 2025 WAEC',
        excerpt: 'Victory Heights Academy records its best-ever WAEC result, with 94% of candidates scoring A1 to C6 across all subjects.',
        content: '',
        publishedAt: '2025-08-15',
        author: 'School Administration',
        slug: 'waec-results-2025',
        coverImageUrl: undefined,
        isPublished: true,
      },
      {
        id: 'n2',
        title: 'Admissions Open for 2026/2027 Academic Session',
        excerpt: 'Applications are now open for JSS 1, JSS 2, SS 1 (Science, Commercial, Arts). Spaces are limited — apply early.',
        content: '',
        publishedAt: '2025-09-01',
        author: 'Admissions Office',
        slug: 'admissions-open-2026',
        coverImageUrl: undefined,
        isPublished: true,
      },
      {
        id: 'n3',
        title: 'New Science and Technology Block Opens',
        excerpt: 'Our state-of-the-art Science and ICT block, featuring 4 laboratories and a dedicated coding lab, is now open.',
        content: '',
        publishedAt: '2025-09-10',
        author: 'School Administration',
        slug: 'new-science-block',
        coverImageUrl: undefined,
        isPublished: true,
      },
    ],
    staff: [],
    testimonials: [
      { id: 't1', quote: 'Victory Heights gave my daughter the confidence and discipline she needed. She got into University of Lagos studying Medicine.', author: 'Mrs. Adeyemi', role: 'Parent, Class of 2024', avatarUrl: undefined, isActive: true },
      { id: 't2', quote: 'The teachers here genuinely care. My son struggled with Mathematics in his previous school. Here, he came first in his class.', author: 'Mr. Okafor', role: 'Parent, JSS 2', avatarUrl: undefined, isActive: true },
      { id: 't3', quote: 'I was admitted to study Computer Science at Covenant University. Victory Heights made it possible.', author: 'Chidi Eze', role: 'Alumni, Class of 2023', avatarUrl: undefined, isActive: true },
    ],
    admissions: {
      isOpen: true,
      sessionLabel: '2026/2027 Academic Session',
      applicationFeeNaira: 5_000,
      requiresPayment: true,
      availableClasses: ['JSS 1', 'JSS 2', 'SS 1 Science', 'SS 1 Commercial', 'SS 1 Arts'],
      requirements: [
        'Original birth certificate',
        'Last two terms\' school report cards',
        'Passport photograph (white background)',
        'Transfer certificate from previous school (for lateral entries)',
      ],
      deadline: '2026-01-31',
      paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ?? 'pk_test_placeholder',
      customFields: [],
    },
    contact: {
      address: '14 Academy Road, Lekki Phase 1',
      city: 'Lagos',
      state: 'Lagos',
      phone: '+234 801 234 5678',
      email: 'info@victoryheights.edu.ng',
      whatsapp: '+234 801 234 5678',
      googleMapsUrl: 'https://maps.google.com/?q=Lekki+Phase+1+Lagos',
    },
    social: {
      facebook: 'https://facebook.com/victoryheightsacademy',
      instagram: 'https://instagram.com/victoryheightsacademy',
    },
    metaDescription: 'Victory Heights Academy — Premier private secondary school in Lagos. Excellent WAEC results, modern facilities, and holistic education.',
    ogImageUrl: undefined,
    isPublished: true,
    publishedAt: '2025-09-01',
    createdAt: '2025-09-01',
    updatedAt: '2025-10-01',
  };
}
