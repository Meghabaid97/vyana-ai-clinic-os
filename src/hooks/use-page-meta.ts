import { useEffect } from "react";

interface PageMeta {
  title: string;
  description: string;
  /** Path including leading slash, e.g. "/why-vyana" */
  path: string;
  ogType?: "website" | "article";
}

const SITE_ORIGIN = "https://vyanacare.lovable.app";

const upsertMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

const upsertCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Lightweight per-route head: title, description, canonical, and og:*.
 * Avoids adding react-helmet-async for a handful of marketing routes.
 * Works for JS-executing crawlers (Googlebot); social-preview crawlers
 * fall back to the sitewide tags in index.html.
 */
export function usePageMeta({ title, description, path, ogType = "website" }: PageMeta) {
  useEffect(() => {
    const url = `${SITE_ORIGIN}${path}`;
    const previousTitle = document.title;
    document.title = title;
    upsertMeta('meta[name="description"]', "name", "description", description);
    upsertCanonical(url);
    upsertMeta('meta[property="og:title"]', "property", "og:title", title);
    upsertMeta('meta[property="og:description"]', "property", "og:description", description);
    upsertMeta('meta[property="og:url"]', "property", "og:url", url);
    upsertMeta('meta[property="og:type"]', "property", "og:type", ogType);
    return () => {
      document.title = previousTitle;
    };
  }, [title, description, path, ogType]);
}
