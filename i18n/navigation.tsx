"use client";

import NextLink from "next/link";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";
import type { ComponentPropsWithoutRef } from "react";
import { useMemo } from "react";
import { useLocale } from "next-intl";

import { defaultLocale, isLocale, type Locale } from "./locales";
import { localizeHref } from "@/lib/routes";

function useSafeLocale(): Locale {
  const locale = useLocale();
  return isLocale(locale) ? locale : defaultLocale;
}

type LinkProps = Omit<ComponentPropsWithoutRef<typeof NextLink>, "href"> & {
  href: string;
};

export function Link({ href, ...props }: LinkProps) {
  const locale = useSafeLocale();
  return <NextLink href={localizeHref(href, locale)} {...props} />;
}

export function usePathname() {
  return useNextPathname();
}

export function useRouter() {
  const router = useNextRouter();
  const locale = useSafeLocale();

  return useMemo(() => {
    return {
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) =>
        router.push(localizeHref(href, locale), options),
      replace: (href: string, options?: Parameters<typeof router.replace>[1]) =>
        router.replace(localizeHref(href, locale), options),
      prefetch: (href: string, options?: Parameters<typeof router.prefetch>[1]) =>
        router.prefetch(localizeHref(href, locale), options),
    };
  }, [router, locale]);
}
