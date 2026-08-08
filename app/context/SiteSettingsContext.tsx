'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchPublicSiteSettings, type SiteSettings } from '@/app/lib/apiClient';

const DEFAULT_INSTAGRAM_GALLERY_URLS = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBB6krFZt3NforzP_CzR4ptQE8-y0eealOxaiOFyw-M_PiEaPfHJmpJx0KQ69PoCCe-8I9bO5ABXLOBzrYtxX6fodcfeGMSdhpRfwL4ik_U7Ohea9FqYCZZSy7necDaaZIVUyzB_JQcC1LoUfL-N7sffd-8fBPsMnS85KvnWDDmmtG2s3J-VvSA4OrZAuNxF2A_7khyXBN_RpmcxVAJR8BB5pYxp6lAeHd0vJVeHjz7LL1feXps7U4mxDgFMTAl-Zan8yykFBkZfy-U',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD7-2TpSC81XkW68SsR5qO7YCUI-agr1FkXJz6iAL2GqdUeil7o-SGTIwoV6Udw2sePVRGEriL-oq9SUQgYH-3hEcuZkF1k-3CDFq-cr9pZnDiVmYHzQPUSiyV0udgVA1j_DWyF6JsNYQjHAkNW1TvbfkMsSnfIjpYIytsbmvb-ArCRej6S77U1GKT9jkDQrHJPzf3oEUrheRg5hgvx1fyraxmtsXLolgFIgYq-RwSv0Evi8FhdOpgt5AtDXT6cBWXgqs8RTmyqT0yf',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBbPAmDMHekqLqrXZLergrySXBUGDZAJIKoEwWT1bZDzRqtg810OU5KsX8xa0w_bgyQIU4a-FSWdOAE4biaiMTeurKmzMJDdLPSSxFc_jAKcsvG44n2gEBH_EwG6oQtmdvBU_BYpG-qhla42bC3ppOILHBgUvSKvt9HCeTLNOVDMlliJFbzs15y6y0NDpMyky2-PtgjrfPcnMlT_A0EKisv2thjdd3ra_3fxCKp6EJ31D4eD_twaLrvhbkw5QN1hT3gD9nV9w4xqUiy',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDKAQ6BN0zpefAWyL1BvwOEYUEHMo8megKTLEmt-S9eb_xLkICO0VQBcPdxjmxdGWX67pZWCsubEihh4MyCwW_aCBjGPXwvOrVMtN_hdtoO3OtP8TuKjEMC4NmQcJLekA7TqDEzk0zKdmI0cWcln_TOiEWQfsOD6helF5CSyKnGrEkpzLixSICrqKjMM-IM9wmXsOXvsQ2nG37VyYlvjtWZq5Vbs3kpZlcNs_wybr-LmbxRQU9ojYeli7yk0P0adT7B7KreSF6SAEOy',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBgvVDiPytr5AGZgDZEwwSmR3CutLMkDaeDqvODNfZKhHAjqN30RAbqvGyYv2Ddf1K7hOFW8ck7KQZb0SMZpzGK9JdP9O4bSZky_-Hm8If1mGAd_t3ke4dh6QyAGJvSbuIE3E6KvrcS_GflfJjf_cDSoUg_Xs35w1LaO2RMVncewWVLNo6mKsEiv1bLbczujHaErcgcinzCspq74o89foNU-zduQpPAyFJmIiFQllEhnz0xVRV2vdQbyZmZF4HEfTM2TNB1CUQ8qqcT',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuC39Rz00OUHQlENEoJpluueV1-p681BILVYn3ImGm_Pys2GQnFrWvE6k7JoE48_-SJVR-IQWsuBzseVTa3wmytgVSCAzj8Rk82xFapDFYCsJpw8_r803fBj80Dx84pd_ioNPiR1LqgQQ_wW_Hb5yewgMeb_xlKK_ASJrhCHZWwlHzvDQH0Oi8n3EL2-UYHxi6deJgoWXu2gSMXjYjG0Cc2NQCs9qug9oae_JceeOUjBarf5jOL8Ocrq8KVSXcPZ64dXclnUXT4YFdhS',
];

const defaultInstagramGallery = DEFAULT_INSTAGRAM_GALLERY_URLS.map((imageUrl, index) => ({
    id: `default-${index}`,
    imageUrl,
    username: 'kinetic_riot',
    sortOrder: index,
    isActive: true,
}));

const defaultSettings: SiteSettings = {
    siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'STREETRIOT',
    navbarTitle: process.env.NEXT_PUBLIC_SITE_NAME || 'STREETRIOT',
    footerTitle: process.env.NEXT_PUBLIC_SITE_NAME || 'STREETRIOT',
    footerDescription:
        process.env.NEXT_PUBLIC_FOOTER_DESCRIPTION ||
        'Forging the future of urban streetwear. Precision engineered, culturally driven, and globally distributed.',
    companyAddress: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '',
    companyEmail: process.env.NEXT_PUBLIC_COMPANY_EMAIL || '',
    companyPhone: process.env.NEXT_PUBLIC_COMPANY_PHONE || '',
    emailFooterDescription:
        process.env.NEXT_PUBLIC_EMAIL_FOOTER_DESCRIPTION ||
        'This is an automated message from StreetRiot commerce engine.',
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || process.env.NEXT_PUBLIC_LOGO_URL || '',
    currencySymbol: process.env.NEXT_PUBLIC_CURRENCY || '₹',
    instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    instagramHandle: process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || 'kinetic_riot',
    instagramGallery: defaultInstagramGallery,
    twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL || '',
    youtubeUrl: process.env.NEXT_PUBLIC_YOUTUBE_URL || '',
    facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    updatedAt: null,
};

type SiteSettingsContextType = {
    settings: SiteSettings;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
    applyLocalSettings: (patch: Partial<SiteSettings>) => void;
};

const SiteSettingsContext = createContext<SiteSettingsContextType | null>(null);

const hasSameSettings = (a: SiteSettings, b: SiteSettings) => {
    const hasSameGallery =
        a.instagramGallery.length === b.instagramGallery.length &&
        a.instagramGallery.every((left, index) => {
            const right = b.instagramGallery[index];
            return (
                left.id === right.id &&
                left.imageUrl === right.imageUrl &&
                (left.imagePublicId || '') === (right.imagePublicId || '') &&
                left.username === right.username &&
                left.sortOrder === right.sortOrder &&
                left.isActive === right.isActive
            );
        });

    return (
        a.siteName === b.siteName &&
        a.navbarTitle === b.navbarTitle &&
        a.footerTitle === b.footerTitle &&
        a.footerDescription === b.footerDescription &&
        a.companyAddress === b.companyAddress &&
        a.companyEmail === b.companyEmail &&
        a.companyPhone === b.companyPhone &&
        a.emailFooterDescription === b.emailFooterDescription &&
        a.logoUrl === b.logoUrl &&
        (a.logoPublicId || '') === (b.logoPublicId || '') &&
        a.currencySymbol === b.currencySymbol &&
        a.instagramUrl === b.instagramUrl &&
        a.instagramHandle === b.instagramHandle &&
        hasSameGallery &&
        a.twitterUrl === b.twitterUrl &&
        a.youtubeUrl === b.youtubeUrl &&
        a.facebookUrl === b.facebookUrl &&
        (a.updatedAt || null) === (b.updatedAt || null)
    );
};

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        try {
            const latest = await fetchPublicSiteSettings();
            setSettings((prev) => {
                const next = { ...prev, ...latest };
                return hasSameSettings(prev, next) ? prev : next;
            });
        } catch {
            // keep defaults if backend settings endpoint fails
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    const applyLocalSettings = useCallback((patch: Partial<SiteSettings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...patch };
            return hasSameSettings(prev, next) ? prev : next;
        });
    }, []);

    const value = useMemo(
        () => ({ settings, isLoading, refreshSettings, applyLocalSettings }),
        [settings, isLoading, refreshSettings, applyLocalSettings],
    );

    return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
    const context = useContext(SiteSettingsContext);
    if (!context) {
        throw new Error('useSiteSettings must be used within SiteSettingsProvider');
    }
    return context;
}
