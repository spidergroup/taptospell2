import {
  type CategoryName,
  type GradeLevel,
  HIGH_SCHOOL_CATEGORIES,
  type HighSchoolCategoryKey,
  type NumericGrade,
  WORD_POOLS,
  getHighSchoolCategoryLabel,
  getWordsPerLevel,
  resolveHighSchoolCategoryKey,
} from '../data/words';

export interface PageSeoMetadata {
  path: string;
  title: string;
  description: string;
  keywords: string[];
  heading: string;
  educationalLevel: string;
  grade?: GradeLevel;
  category?: CategoryName;
  sampleWords: string[];
}

export const SITE_NAME = 'TapToSpell';
export const DEFAULT_BASE_URL = 'https://taptospell.com';

const GRADE_ORDINAL_LABELS: Record<NumericGrade, string> = {
  1: '1st Grade',
  2: '2nd Grade',
  3: '3rd Grade',
  4: '4th Grade',
  5: '5th Grade',
  6: '6th Grade',
};

const GRADE_SEO_DESCRIPTIONS: Record<NumericGrade, string> = {
  1: 'Free interactive 1st Grade spelling game with 315 Dolch, Fry, and Common Core sight words, emoji cues, and spoken audio pronunciation.',
  2: 'Practice 2nd Grade spelling and vocabulary with 218 curated elementary words across 3 progressive difficulty tiers, audio pronunciation, and smart hints.',
  3: 'Master 3rd Grade spelling words with 228 curriculum vocabulary terms, multisyllabic patterns, spoken TTS audio, and tactile 3D letter tiles.',
  4: 'Interactive 4th Grade spelling and academic vocabulary game featuring 357 Common Core ELA words, progressive levels, and instant error feedback.',
  5: 'Build 5th Grade vocabulary and spelling skills with 415 words covering Latin/Greek roots, academic tier-2 terms, and audio-guided practice.',
  6: 'Challenge 6th Grade learners with 431 advanced elementary and middle-school transition vocabulary words across 10 progressive levels.',
};

const HIGH_SCHOOL_CATEGORY_SLUGS: Record<HighSchoolCategoryKey, string> = {
  colors: 'colors',
  animals: 'animals',
  everyday_life: 'everyday-life',
  nature: 'nature',
  places: 'places',
  movies: 'movies',
  fruits: 'fruits',
};

const HIGH_SCHOOL_CATEGORY_DESCRIPTIONS: Record<HighSchoolCategoryKey, string> = {
  colors:
    'High School Colors & Shades spelling game with 107 vocabulary words from basic hues to advanced artistic and literary color terms.',
  animals:
    'High School Animals & Wildlife spelling game featuring 259 zoology and animal kingdom vocabulary words across 4 difficulty tiers.',
  everyday_life:
    'High School Everyday Life vocabulary & spelling game with 350 essential, conversational, and nuanced daily life words.',
  nature:
    'High School Nature, Weather & Ecology spelling game with 303 environmental, botanical, and earth science vocabulary words.',
  places:
    'High School Places, Architecture & Geography spelling game featuring 320 spatial, urban, and landmark vocabulary terms.',
  movies:
    'High School Movies, Cinema & Storytelling spelling game with 250 film, genre, and dramatic arts vocabulary words.',
  fruits:
    'High School Fruits, Culinary & Botanical spelling game featuring 231 common, tropical, and exotic fruit vocabulary words.',
};

export function getAllSeoPages(): PageSeoMetadata[] {
  const homePage: PageSeoMetadata = {
    path: '/',
    title: 'TapToSpell! — Free Kids & High School Spelling Game (Grades 1–6 & 7 Topics)',
    description:
      'Interactive educational spelling and vocabulary game for Grades 1–6 and High School. Practice 3,875+ curated words with emoji visual cues, spoken audio pronunciation, and smart hints.',
    keywords: [
      'spelling game',
      'kids spelling game',
      'elementary vocabulary game',
      '1st grade spelling words',
      '2nd grade spelling words',
      '3rd grade spelling words',
      '4th grade spelling words',
      '5th grade spelling words',
      '6th grade spelling words',
      'high school vocabulary game',
      'sight words game',
      'phonics game',
      'TapToSpell',
    ],
    heading: 'TapToSpell!',
    educationalLevel: 'Grades 1–6, High School',
    sampleWords: ['CAT', 'APPLE', 'BECAUSE', 'KNOWLEDGE', 'ENVIRONMENT'],
  };

  const gradePages: PageSeoMetadata[] = ([1, 2, 3, 4, 5, 6] as NumericGrade[]).map((grade) => {
    const pool = WORD_POOLS.grades[`grade_${grade}`];
    const totalCount = pool.level_1.length + pool.level_2.length + pool.level_3.length;
    const sampleWords = [
      ...pool.level_1.slice(0, 3),
      ...pool.level_2.slice(0, 3),
      ...pool.level_3.slice(0, 2),
    ].map((w) => w.w);
    const label = GRADE_ORDINAL_LABELS[grade];

    return {
      path: `/grade/${grade}`,
      title: `${label} Spelling Game (${totalCount} Curriculum Words) | TapToSpell`,
      description: GRADE_SEO_DESCRIPTIONS[grade],
      keywords: [
        `${label.toLowerCase()} spelling game`,
        `${label.toLowerCase()} spelling words`,
        `${label.toLowerCase()} vocabulary`,
        `grade ${grade} sight words`,
        'elementary spelling practice',
        'TapToSpell',
      ],
      heading: `${label} Spelling & Vocabulary`,
      educationalLevel: label,
      grade,
      category: `Grade ${grade}`,
      sampleWords,
    };
  });

  const highSchoolHubPage: PageSeoMetadata = {
    path: '/high-school',
    title: 'High School Vocabulary & Spelling Game — 7 Topic Categories (2,011 Words) | TapToSpell',
    description:
      'Practice 2,011 High School English spelling and vocabulary words across 7 themed categories: Colors, Animals, Everyday Life, Nature, Places, Movies, and Fruits.',
    keywords: [
      'high school spelling game',
      'high school vocabulary practice',
      'advanced english spelling',
      'SAT vocabulary game',
      'themed spelling words',
      'TapToSpell',
    ],
    heading: 'High School Vocabulary Categories',
    educationalLevel: 'High School (Grades 9–12)',
    grade: 'high_school',
    sampleWords: ['CRIMSON', 'CHAMELEON', 'RENDEZVOUS', 'ARCHIPELAGO', 'POMEGRANATE'],
  };

  const highSchoolCategoryPages: PageSeoMetadata[] = HIGH_SCHOOL_CATEGORIES.map((cat) => {
    const pool = WORD_POOLS.highSchool[cat.key];
    const totalCount =
      pool.level_1.length + pool.level_2.length + pool.level_3.length + pool.level_4.length;
    const sampleWords = [
      ...pool.level_1.slice(0, 2),
      ...pool.level_2.slice(0, 2),
      ...pool.level_3.slice(0, 2),
      ...pool.level_4.slice(0, 2),
    ].map((w) => w.w);
    const slug = HIGH_SCHOOL_CATEGORY_SLUGS[cat.key];

    return {
      path: `/high-school/${slug}`,
      title: `${cat.label} Spelling Game — High School Vocabulary (${totalCount} Words) | TapToSpell`,
      description: HIGH_SCHOOL_CATEGORY_DESCRIPTIONS[cat.key],
      keywords: [
        `${cat.label.toLowerCase()} spelling words`,
        `${cat.label.toLowerCase()} vocabulary game`,
        'high school spelling',
        'english vocabulary game',
        'TapToSpell',
      ],
      heading: `${cat.label} — High School Spelling`,
      educationalLevel: 'High School (Grades 9–12)',
      grade: 'high_school',
      category: cat.label,
      sampleWords,
    };
  });

  return [homePage, ...gradePages, highSchoolHubPage, ...highSchoolCategoryPages];
}

export function resolveSeoForPathname(pathname: string): PageSeoMetadata | null {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/+$/, '').toLowerCase();
  const pages = getAllSeoPages();
  return pages.find((p) => p.path.toLowerCase() === normalized) ?? null;
}

export function getSeoForGameSession(
  grade: GradeLevel,
  category?: CategoryName,
  level?: number
): PageSeoMetadata {
  const pages = getAllSeoPages();
  if (grade === 'high_school') {
    if (category) {
      const catKey = resolveHighSchoolCategoryKey(String(category));
      const slug = HIGH_SCHOOL_CATEGORY_SLUGS[catKey];
      const match = pages.find((p) => p.path === `/high-school/${slug}`);
      if (match) {
        if (level && level > 1) {
          return {
            ...match,
            title: `${ getHighSchoolCategoryLabel(String(category)) } — Level ${level}/10 (High School) | TapToSpell`,
          };
        }
        return match;
      }
    }
    return pages.find((p) => p.path === '/high-school') ?? pages[0];
  }

  const match = pages.find((p) => p.path === `/grade/${grade}`);
  if (match) {
    if (level && level > 1) {
      return {
        ...match,
        title: `${GRADE_ORDINAL_LABELS[grade]} Spelling — Level ${level}/10 | TapToSpell`,
      };
    }
    return match;
  }

  return pages[0];
}

export function buildJsonLd(page: PageSeoMetadata, origin: string = DEFAULT_BASE_URL): string {
  const canonicalUrl = `${origin.replace(/\/+$/, '')}${page.path === '/' ? '/' : page.path}`;
  const wordsPerLevel = page.grade ? getWordsPerLevel(page.grade) : 3;

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${origin.replace(/\/+$/, '')}/`,
    },
  ];

  if (page.path.startsWith('/high-school')) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: 'High School',
      item: `${origin.replace(/\/+$/, '')}/high-school`,
    });
    if (page.path !== '/high-school' && page.category) {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 3,
        name: String(page.category),
        item: canonicalUrl,
      });
    }
  } else if (page.path.startsWith('/grade/') && page.grade) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: `Grade ${page.grade}`,
      item: canonicalUrl,
    });
  }

  const graph: Record<string, unknown>[] = [
    {
      '@type': ['WebApplication', 'LearningResource'],
      '@id': `${canonicalUrl}#app`,
      name: page.title,
      headline: page.heading,
      description: page.description,
      url: canonicalUrl,
      applicationCategory: 'EducationalApplication',
      applicationSubCategory: 'Spelling & Vocabulary Game',
      educationalUse: ['Spelling Practice', 'Vocabulary Building', 'Phonemic Awareness'],
      educationalLevel: page.educationalLevel,
      learningResourceType: 'Interactive Game',
      inLanguage: 'en-US',
      isAccessibleForFree: true,
      operatingSystem: 'All (Web Browser, iOS, Android, Windows, macOS)',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
      teaches: page.sampleWords,
      numberOfItems: wordsPerLevel * 10,
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
  ];

  if (page.path === '/') {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What grades and vocabulary levels are included in TapToSpell?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'TapToSpell includes Grades 1 through 6 elementary spelling curricula (1,864 words based on Dolch, Fry, Marzano, and Common Core standards) plus a High School mode with 2,011 words across 7 topic categories (Colors, Animals, Everyday Life, Nature, Places, Movies, and Fruits).',
          },
        },
        {
          '@type': 'Question',
          name: 'How does progressive difficulty work across the 10 levels?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Each 10-level game starts with foundational words in early levels and automatically advances to intermediate and challenging multi-syllabic vocabulary in higher levels without repeating words prematurely.',
          },
        },
      ],
    });
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph,
  });
}

export function updateDocumentSeo(page: PageSeoMetadata): void {
  if (typeof document === 'undefined') return;

  document.title = page.title;

  const setMetaContent = (selector: string, attrName: 'name' | 'property', attrVal: string, content: string) => {
    let el = document.querySelector<HTMLMetaElement>(selector);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attrName, attrVal);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  setMetaContent('meta[name="description"]', 'name', 'description', page.description);
  setMetaContent('meta[name="keywords"]', 'name', 'keywords', page.keywords.join(', '));
  setMetaContent('meta[property="og:title"]', 'property', 'og:title', page.title);
  setMetaContent('meta[property="og:description"]', 'property', 'og:description', page.description);
  setMetaContent('meta[name="twitter:title"]', 'name', 'twitter:title', page.title);
  setMetaContent('meta[name="twitter:description"]', 'name', 'twitter:description', page.description);

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin || DEFAULT_BASE_URL;
    const canonicalHref = `${origin}${page.path === '/' ? '/' : page.path}`;
    setMetaContent('meta[property="og:url"]', 'property', 'og:url', canonicalHref);

    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalHref);

    let ldScript = document.querySelector<HTMLScriptElement>('script#seo-json-ld');
    if (ldScript) {
      ldScript.textContent = buildJsonLd(page, origin);
    }
  }
}

export function generateSitemapXml(origin: string = DEFAULT_BASE_URL): string {
  const base = origin.replace(/\/+$/, '');
  const pages = getAllSeoPages();
  const urls = pages
    .map((p) => {
      const loc = `${base}${p.path === '/' ? '/' : p.path}`;
      const priority = p.path === '/' ? '1.0' : p.path === '/high-school' ? '0.9' : '0.8';
      return `  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function generateRobotsTxt(origin: string = DEFAULT_BASE_URL): string {
  const base = origin.replace(/\/+$/, '');
  return `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`;
}

export function generateWebManifest(): string {
  return JSON.stringify(
    {
      name: 'TapToSpell! — Kids & High School Spelling Game',
      short_name: 'TapToSpell',
      description:
        'Interactive spelling and vocabulary game for Grades 1–6 and High School with 3,875+ curated words, spoken audio pronunciation, and emoji visual cues.',
      start_url: '/',
      display: 'standalone',
      background_color: '#0f172a',
      theme_color: '#0f172a',
      orientation: 'any',
      categories: ['education', 'games', 'kids'],
      icons: [
        {
          src: '/favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any maskable',
        },
      ],
    },
    null,
    2
  );
}

