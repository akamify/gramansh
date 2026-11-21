"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

const META_PIXEL_ID = "996611950188434";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);

  const trackPageView = useCallback(() => {
    // The inline script creates fbq's queue before the async Meta library loads.
    // onReady also calls this if the first effect runs before that queue exists.
    if (!window.fbq) return;
    const url = window.location.pathname + window.location.search;
    if (lastTrackedUrl.current === url) return;

    window.fbq("track", "PageView");
    lastTrackedUrl.current = url;
  }, []);

  useEffect(() => {
    trackPageView();
  }, [pathname, searchParams, trackPageView]);

  return (
    <Script id="meta-pixel" strategy="afterInteractive" onReady={trackPageView}>
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');`}
    </Script>
  );
}
