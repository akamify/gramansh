'use client';
import ContactForm from './ContactForm';
import { useSiteSettings } from '@/app/context/SiteSettingsContext';

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const supportEmail = settings.companyEmail || 'support@gramansh.com';
  const supportPhone = settings.companyPhone || '+91 12345 67890';
  const supportAddress = settings.companyAddress || 'India';

  return (
    <div data-scroll-section className="pt-25 pb-20 px-6 md:px-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        <header className="border-b border-[#1c1b1b]/10 pb-6">
          <p className="font-headline text-[10px] uppercase tracking-[0.2em] text-[#b90c1b]">Contact</p>
          <h1 className="font-brand text-5xl md:text-7xl uppercase tracking-tight mt-2">Get In Touch</h1>
          <p className="font-headline text-xs uppercase tracking-[0.12em] text-[#1c1b1b]/50 mt-3">We typically reply within 1-2 business days.</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="font-brand text-2xl uppercase tracking-wide">Customer Support</h2>
            <p className="font-headline text-sm leading-7 text-[#1c1b1b]/75">For order inquiries, shipping questions, or product information, reach out to our support team.</p>

            <div className="space-y-3">
              <div>
                <div className="text-xs font-label uppercase text-on-surface-variant">Email</div>
                <a href={`mailto:${supportEmail}`} className="text-primary font-bold">{supportEmail}</a>
              </div>
              <div>
                <div className="text-xs font-label uppercase text-on-surface-variant">Phone</div>
                <a href={`tel:${supportPhone.replace(/\s+/g, '')}`} className="text-primary font-bold">{supportPhone}</a>
              </div>
              <div>
                <div className="text-xs font-label uppercase text-on-surface-variant">Address</div>
                <p className="text-primary font-bold">{supportAddress}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-brand text-xl uppercase tracking-wide mb-4">Send us a message</h3>
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
