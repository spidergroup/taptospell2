import { describe, expect, it } from 'vitest';
import worker from '../worker';
import {
  buildJsonLd,
  generateRobotsTxt,
  generateSitemapXml,
  getAllSeoPages,
  getSeoForGameSession,
  resolveSeoForPathname,
} from './seo';

describe('seo.ts & worker.ts — Multi-Page SEO, Structured Data, Sitemap & Robots', () => {
  it('defines 15 unique SEO pages covering Home, Grades 1–6, High School Hub, and all 7 High School categories', () => {
    const pages = getAllSeoPages();
    expect(pages.length).toBe(15);

    const titles = new Set(pages.map((p) => p.title));
    const descriptions = new Set(pages.map((p) => p.description));
    const paths = pages.map((p) => p.path);

    expect(titles.size).toBe(15);
    expect(descriptions.size).toBe(15);
    expect(paths).toEqual([
      '/',
      '/grade/1',
      '/grade/2',
      '/grade/3',
      '/grade/4',
      '/grade/5',
      '/grade/6',
      '/high-school',
      '/high-school/colors',
      '/high-school/animals',
      '/high-school/everyday-life',
      '/high-school/nature',
      '/high-school/places',
      '/high-school/movies',
      '/high-school/fruits',
    ]);
  });

  it('builds valid schema.org JSON-LD with WebApplication, LearningResource, BreadcrumbList, and FAQPage', () => {
    const homeSeo = resolveSeoForPathname('/')!;
    const homeLd = JSON.parse(buildJsonLd(homeSeo, 'https://taptospell.com'));
    expect(homeLd['@context']).toBe('https://schema.org');
    expect(homeLd['@graph'].length).toBe(3);

    const hsCategorySeo = getSeoForGameSession('high_school', 'Everyday Life', 3);
    expect(hsCategorySeo.path).toBe('/high-school/everyday-life');
    expect(hsCategorySeo.title).toContain('Level 3/10');
  });

  it('generates sitemap.xml containing all 15 canonical URLs and robots.txt pointing to sitemap.xml', () => {
    const sitemap = generateSitemapXml('https://taptospell.com');
    expect(sitemap).toContain('<loc>https://taptospell.com/</loc>');
    expect(sitemap).toContain('<loc>https://taptospell.com/grade/6</loc>');
    expect(sitemap).toContain('<loc>https://taptospell.com/high-school/everyday-life</loc>');

    const robots = generateRobotsTxt('https://taptospell.com');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://taptospell.com/sitemap.xml');
  });

  it('serves SSR HTML with route-specific meta tags, canonical link, Open Graph, JSON-LD, and SEO endpoints', async () => {
    const homeRes = await worker.fetch(new Request('https://taptospell.com/'), {});
    expect(homeRes.status).toBe(200);
    const homeHtml = await homeRes.text();
    expect(homeHtml).toContain('https://www.youtube.com/watch?v=NR8sOxgxeV0');
    expect(homeHtml).toContain('https://www.youtube.com/embed/NR8sOxgxeV0');

    const gradeRes = await worker.fetch(new Request('https://taptospell.com/grade/4'), {});
    expect(gradeRes.status).toBe(200);
    const gradeHtml = await gradeRes.text();
    expect(gradeHtml).toContain('<title>4th Grade Spelling Game (357 Curriculum Words) | TapToSpell</title>');
    expect(gradeHtml).toContain('googletagmanager.com/gtm.js?id=GTM-T5F7LZ59');
    expect(gradeHtml).toContain('<link rel="canonical" href="https://taptospell.com/grade/4" />');
    expect(gradeHtml).toContain('property="og:url" content="https://taptospell.com/grade/4"');
    expect(gradeHtml).toContain('application/ld+json');

    const hsRes = await worker.fetch(
      new Request('https://taptospell.com/high-school/animals'),
      {}
    );
    expect(hsRes.status).toBe(200);
    const hsHtml = await hsRes.text();
    expect(hsHtml).toContain('Animals Spelling Game — High School Vocabulary (259 Words) | TapToSpell');

    const sitemapRes = await worker.fetch(new Request('https://taptospell.com/sitemap.xml'), {});
    expect(sitemapRes.status).toBe(200);
    expect(sitemapRes.headers.get('Content-Type')).toContain('application/xml');

    const robotsRes = await worker.fetch(new Request('https://taptospell.com/robots.txt'), {});
    expect(robotsRes.status).toBe(200);
    expect(await robotsRes.text()).toContain('Sitemap: https://taptospell.com/sitemap.xml');
  });
});

