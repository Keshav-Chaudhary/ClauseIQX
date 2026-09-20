import type { ReactNode } from "react";

declare module "next" {
  export interface Metadata {
    title?: string | { default: string; template: string };
    description?: string;
    keywords?: string[] | string;
    authors?: any;
    openGraph?: any;
    twitter?: any;
    icons?: any;
    robots?: any;
    viewport?: any;
    [key: string]: any;
  }
}

declare module "next/font/google" {
  export interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    variable?: string;
    display?: string;
    preload?: boolean;
    fallback?: string[];
    adjustFontFallback?: boolean;
  }

  export interface FontObject {
    className: string;
    variable: string;
    style: { fontFamily: string };
  }

  export function Outfit(options?: FontOptions): FontObject;
  export function Geist_Mono(options?: FontOptions): FontObject;
  export function Inter(options?: FontOptions): FontObject;
  export function Roboto(options?: FontOptions): FontObject;
}

declare module "next/navigation" {
  export function usePathname(): string;
  export function useRouter(): {
    push(url: string, options?: any): void;
    replace(url: string, options?: any): void;
    forward(): void;
    back(): void;
    prefetch(url: string): void;
    refresh(): void;
  };
  export function useSearchParams(): URLSearchParams;
  export function useParams<T = Record<string, string | string[]>>(): T;
  export function useServerInsertedHTML(callback: () => ReactNode): void;
  export function redirect(url: string): never;
  export function notFound(): never;
}
