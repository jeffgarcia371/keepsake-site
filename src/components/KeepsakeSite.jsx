import React, { useMemo, useState, useEffect } from "react";

/**
 * Keepsake Video Transfers — One‑Page Website
 *
 * Notes for Jeff:
 * - Replace BUSINESS.email / phone / social links below.
 * - Tweak pricing variables as you like — calculator updates live.
 * - Until you add a Formspree ID, the form uses mailto: (no backend required).
 * - Publish anywhere (Vercel/Netlify/GitHub Pages). Tailwind is available in this preview.
 */

const BUSINESS = {
  name: "Keepsake Video Transfers",
  tagline: "Digitize your VHS memories — safely, locally, and affordably.",
  city: "San Fernando Valley, Los Angeles",
  email: "keepsakevideotransfers@gmail.com",
  phone: "(818) 253-4728",
  websiteUrl: "https://keepsakevideotransfers.com",
  ogImage: "/og.jpg",
  calendlyUrl: "https://calendly.com/keepsakevideotransfers/drop-off",
  formspreeFormId: "xqaljowj",
  addressNote:
    "By-appointment drop‑off at gated residence (exact address sent after booking).",
  hours: "Mon–Sat, 9am–6pm",
  turnaround: "3–7 days typical",
  runtimeIncludedMins: 120,
  pricePerTapeUSD: 30,
  extraRuntimePricePerHrUSD: 10,
  addOns: [
    { id: "usb", label: "USB drive (32GB)", price: 10 },
    { id: "hdd", label: "External HDD (1TB)", price: 60 },
    { id: "cloud", label: "Cloud delivery link", price: 0 },
    { id: "extra", label: "Extra copy per tape", price: 8 },
    { id: "pickup", label: "Pickup service +$10", price: 10 },
    { id: "return", label: "Drop-off service +$10", price: 10 },
  ],
  bulkDiscounts: [
    { min: 5, percentOff: 10 },
    { min: 10, percentOff: 15 },
  ],
};

/**
 * Pure estimator used by UI and by tests.
 */
function computeEstimate(tapes, runtimeMins, selectedAddOns) {
  const perTape = BUSINESS.pricePerTapeUSD;
  const base = tapes * perTape;

  // Bulk discount on base only
  const bestTier = [...BUSINESS.bulkDiscounts]
    .sort((a, b) => b.min - a.min)
    .find((t) => tapes >= t.min);
  const discountPct = bestTier ? bestTier.percentOff : 0;
  const discountedBase = base * (1 - discountPct / 100);

  // Extra runtime beyond included (per tape)
  const extraTotalMins = Math.max(0, runtimeMins - BUSINESS.runtimeIncludedMins);
  const extraHours = extraTotalMins / 60;
  const extraSubtotal = extraHours * BUSINESS.extraRuntimePricePerHrUSD * tapes;

  // Add‑ons charged once, except "extra copy per tape" which is per tape
  let addOnSubtotal = 0;
  for (const id of selectedAddOns || []) {
    const a = BUSINESS.addOns.find((x) => x.id === id);
    if (!a) continue;
    if (id === "extra") addOnSubtotal += a.price * tapes;
    else addOnSubtotal += a.price;
  }

  const subtotal = Math.max(
    0,
    Math.round((discountedBase + extraSubtotal + addOnSubtotal) * 100) / 100
  );
  return {
    perTape,
    discountPct,
    base,
    discountedBase,
    extraHours,
    extraSubtotal,
    addOnSubtotal,
    subtotal,
  };
}

// Lightweight runtime tests (run once in the browser console). Does not affect UI.
(function runBasicTests() {
  if (typeof window === "undefined" || window.__KEEPSAKE_TESTS_DONE__) return;
  window.__KEEPSAKE_TESTS_DONE__ = true;
  const eq = (a, b, msg) => console.assert(Math.abs(a - b) < 1e-6, msg + ` → got ${a}, expected ${b}`);

  // 1) Zero tapes → zero cost
  eq(computeEstimate(0, 120, []).subtotal, 0, "Zero tapes subtotal should be 0");

  // 2) No extra runtime, 1 tape
  eq(computeEstimate(1, BUSINESS.runtimeIncludedMins, []).subtotal, BUSINESS.pricePerTapeUSD, "1 tape within included mins");

  // 3) Extra runtime: +60 min beyond included, 1 tape
  eq(
    computeEstimate(1, BUSINESS.runtimeIncludedMins + 60, []).subtotal,
    BUSINESS.pricePerTapeUSD + BUSINESS.extraRuntimePricePerHrUSD,
    "+60 mins should add one extra-hour charge"
  );

  // 4) Add‑on: extra copy per tape multiplies by tape count
  eq(
    computeEstimate(3, BUSINESS.runtimeIncludedMins, ["extra"]).addOnSubtotal,
    3 * BUSINESS.addOns.find(a=>a.id==='extra').price,
    "Extra copy charges per tape"
  );

  // 5) Bulk discount tier kicks in at 5
  const tier = BUSINESS.bulkDiscounts.find(t=>t.min===5);
  const est5 = computeEstimate(5, BUSINESS.runtimeIncludedMins, []);
  eq(
    est5.discountPct,
    tier ? tier.percentOff : 0,
    "Bulk discount percent at 5 tapes"
  );
})();

export default function KeepsakeSite() {
  // Calculator state
  const [tapes, setTapes] = useState(3);
  const [runtimeMins, setRuntimeMins] = useState(BUSINESS.runtimeIncludedMins);
  const [selectedAddOns, setSelectedAddOns] = useState(["cloud"]);
  const [formStatus, setFormStatus] = useState("idle");

  const useFormspree = Boolean(BUSINESS.formspreeFormId);

  // SEO basics + Calendly assets
  useEffect(() => {
    const title = `${BUSINESS.name} — VHS Digitizing in ${BUSINESS.city}`;
    document.title = title;

    const setMeta = (attr, key, value) => {
      let el = document.head.querySelector(`meta[${attr}='${key}']`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    const setLink = (rel, href) => {
      let el = document.head.querySelector(`link[rel='${rel}']`);
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    const desc = "Local VHS to digital transfers with fast turnaround in the San Fernando Valley.";
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", BUSINESS.websiteUrl);
    setMeta("property", "og:image", BUSINESS.ogImage);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", BUSINESS.ogImage);
    setLink("canonical", BUSINESS.websiteUrl);

    // Calendly embed assets
    if (BUSINESS.calendlyUrl) {
      if (!document.querySelector('link[href^="https://assets.calendly.com/assets/external/widget.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://assets.calendly.com/assets/external/widget.css";
        document.head.appendChild(link);
      }
      if (!document.querySelector('script[src^="https://assets.calendly.com/assets/external/widget.js"]')) {
        const script = document.createElement("script");
        script.src = "https://assets.calendly.com/assets/external/widget.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  const calc = useMemo(
    () => computeEstimate(tapes, runtimeMins, selectedAddOns),
    [tapes, runtimeMins, selectedAddOns]
  );

  function toggleAddOn(id) {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (document.getElementById("name") || {}).value || "";
    const email = (document.getElementById("email") || {}).value || "";
    const phone = (document.getElementById("phone") || {}).value || "";
    const message = (document.getElementById("message") || {}).value || "";

    if (!useFormspree) {
      const subject = encodeURIComponent(`Quote request — ${tapes} tape(s)`);
      const body = encodeURIComponent(
        [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `Tapes: ${tapes}`,
          `Avg runtime per tape: ${runtimeMins} min`,
          `Selected add‑ons: ${selectedAddOns.join(", ") || "none"}`,
          `Estimated total: $${calc.subtotal.toFixed(2)}`,
          "",
          message,
        ].join("\n")
      );
      window.location.href = `mailto:${BUSINESS.email}?subject=${subject}&body=${body}`;
      setFormStatus("success");
      form.reset();
      return;
    }

    setFormStatus("submitting");
    const data = new FormData(form);
    data.set("avg_runtime_per_tape_min", String(runtimeMins));
    data.set("selected_add_ons", selectedAddOns.join(", "));
    data.set("estimated_total", calc.subtotal.toFixed(2));
    data.set("_subject", "Keepsake VHS — Quote/Booking Request");

    fetch(`https://formspree.io/f/${BUSINESS.formspreeFormId}`, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (res.ok) {
          setFormStatus("success");
          form.reset();
        } else {
          setFormStatus("error");
        }
      })
      .catch(() => setFormStatus("error"));
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* SEO / Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: BUSINESS.name,
            areaServed: BUSINESS.city,
            telephone: BUSINESS.phone,
            email: BUSINESS.email,
            slogan: BUSINESS.tagline,
            openingHours: BUSINESS.hours,
            url: BUSINESS.websiteUrl,
            priceRange: "$",
            description:
              "VHS digitizing and video transfer service. By-appointment drop-off in the San Fernando Valley; fast turnaround and careful handling.",
          }),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm" />
            <div className="font-semibold tracking-tight">{BUSINESS.name}</div>
          </div>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="#how" className="hover:text-indigo-600">
              How it works
            </a>
            <a href="#pricing" className="hover:text-indigo-600">
              Pricing
            </a>
            <a href="#book" className="hover:text-indigo-600">
              Book
            </a>
            <a href="#faq" className="hover:text-indigo-600">
              FAQ
            </a>
            <a
              href="#book"
              className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
            >
              Book now
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-neutral-900">
              Relive your VHS memories —
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 leading-[1.15] pb-[0.2em]">
                digitized with care in the San Fernando Valley
              </span>
            </h1>
            <p className="mt-4 text-neutral-700 max-w-prose">
              We transfer VHS tapes to modern digital formats so your family stories don’t fade. Local, by‑appointment drop‑off and fast turnaround. No upsell gimmicks — just clean, reliable transfers.
            </p>
            <ul className="mt-6 grid sm:grid-cols-2 gap-2 text-sm text-neutral-700">
              <li className="flex items-center gap-2">
                <Dot /> High‑quality capture & deinterlacing
              </li>
              <li className="flex items-center gap-2">
                <Dot /> MP4 files for easy sharing
              </li>
              <li className="flex items-center gap-2">
                <Dot /> {BUSINESS.turnaround}
              </li>
              <li className="flex items-center gap-2">
                <Dot /> {BUSINESS.addressNote}
              </li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#book"
                className="rounded-xl px-4 py-2 bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
              >
                Book a drop‑off
              </a>
              <a
                href="#pricing"
                className="rounded-xl px-4 py-2 border border-neutral-300 text-neutral-900 text-sm font-medium hover:bg-neutral-100"
              >
                See pricing
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-video w-full rounded-2xl bg-neutral-200 shadow-inner overflow-hidden">
              {/* Placeholder mockup */}
              <div className="h-full w-full grid grid-cols-3">
                <div className="bg-neutral-100" />
                <div className="bg-neutral-200" />
                <div className="bg-neutral-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-neutral-500 text-center">
              Sample preview — replace with real before/after stills later.
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How it works</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Step n={1} title="Book a time">
            Choose a window for drop‑off. We’ll send exact instructions for meeting at the gate.
          </Step>
          <Step n={2} title="Secure transfer">
            We capture your tapes to high‑quality MP4 files. Light cleanup (levels, cropping) included.
          </Step>
          <Step n={3} title="Delivery your way">
            Pick cloud link, USB, or both. We keep files for 14 days in case you need a re‑send.
          </Step>
          <Step n={4} title="Optional pickup / return">
            Need help with logistics? We offer pickup and/or return drop‑off within 10 miles for $10 each way. Beyond that, +$1 per extra mile.
          </Step>
        </div>
      </section>

      {/* Pricing & Calculator */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Simple pricing</h2>
        <p className="mt-2 text-neutral-700 max-w-prose">
          One flat rate per tape includes up to {BUSINESS.runtimeIncludedMins} minutes. Longer tapes are billed at ${
            BUSINESS.extraRuntimePricePerHrUSD
          }/hour of extra runtime. Bulk discounts apply automatically.
        </p>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-neutral-500">Per tape</div>
            <div className="mt-1 text-4xl font-bold tracking-tight">
              ${BUSINESS.pricePerTapeUSD}
            </div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              <li className="flex items-center gap-2">
                <Dot /> Up to {BUSINESS.runtimeIncludedMins} min included
              </li>
              <li className="flex items-center gap-2">
                <Dot /> MP4 digital file(s)
              </li>
              <li className="flex items-center gap-2">
                <Dot /> Light trim & cropping
              </li>
              <li className="flex items-center gap-2">
                <Dot /> Optional USB/HDD add‑ons
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h3 className="font-semibold">Estimate your total</h3>
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <NumberField label="Number of tapes" value={tapes} min={0} onChange={(v) => setTapes(v)} />
              <NumberField
                label={`Avg runtime per tape (min)`}
                value={runtimeMins}
                min={0}
                onChange={(v) => setRuntimeMins(v)}
              />
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium">Add‑ons</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {BUSINESS.addOns.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleAddOn(a.id)}
                    className={
                      "text-sm rounded-xl border px-3 py-1.5 " +
                      (selectedAddOns.includes(a.id)
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-neutral-300 hover:bg-neutral-100")
                    }
                    aria-pressed={selectedAddOns.includes(a.id)}
                  >
                    {a.label}{!a.label.includes('+$') ? (a.price > 0 ? ` +$${a.price}` : " (free)") : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
              <Line label="Base" value={`$${calc.base.toFixed(2)}`} />
              <Line
                label={calc.discountPct > 0 ? `Bulk discount (${calc.discountPct}% )` : "Bulk discount"}
                value={calc.discountPct > 0 ? `–${(calc.base - calc.discountedBase).toFixed(2)}` : "$0.00"}
              />
              <Line label="Extra runtime" value={`$${calc.extraSubtotal.toFixed(2)}`} />
              <Line label="Add‑ons" value={`$${calc.addOnSubtotal.toFixed(2)}`} />
              <div className="sm:col-span-2 h-px bg-neutral-200" />
              <Line bold label="Estimated total" value={`$${calc.subtotal.toFixed(2)}`} />
            </div>

            <div className="mt-6 text-xs text-neutral-500">
              Estimates are not final quotes. Sales tax may apply to physical media (USB/HDD).
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-neutral-700">
          <span className="font-medium">Bulk tiers: </span>
          {BUSINESS.bulkDiscounts.map((t, i) => (
            <span key={i} className="mr-3">
              {t.min}+ tapes → {t.percentOff}% off
            </span>
          ))}
          <div className="mt-3">
            Pickup and return drop‑off are available within <b>10 miles</b> for <b>$10 each way</b>. Beyond 10 miles, add <b>$1 per extra mile</b> (rounded up).
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Why Keepsake</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Feature title="Local & accountable">
            Meet a real person to handle your tapes. No shipping your memories across the country.
          </Feature>
          <Feature title="Clean, watchable files">
            We target sane file sizes and smooth playback — ready for phones, TVs, and drives.
          </Feature>
          <Feature title="No upsell circus">
            Transparent pricing, optional add‑ons, and a 14‑day file backup window.
          </Feature>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          <Faq q="Do you fix damaged tapes or restore video?">
            Transfers are done "as‑is". We don’t offer full restoration. Minor level and crop adjustments are
            included.
          </Faq>
          <Faq q={`How long do you keep my files?`}>
            We store digital files for 14 days after delivery for re‑send requests, then delete them for privacy.
          </Faq>
          <Faq q="Can I mail my tapes?">
            We only serve clients with by‑appointment drop‑off or pickup.
          </Faq>
          <Faq q="Do you transfer copyrighted content?">
            We only accept content you own or have rights to. Please don’t submit copyrighted movies or shows.
          </Faq>
          <Faq q="Do you offer pickup or return drop‑off?">
            Yes — within 10 miles it’s $10 <i>each way</i>. Beyond 10 miles, add $1 per extra mile (rounded up). Select these in the estimator or mention it when you book.
          </Faq>
        </div>
      </section>

      {/* Book Online */}
      <section id="book" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">Book a drop‑off online</h2>
        <p className="mt-2 text-neutral-700 max-w-prose">
          Prefer to lock a time right now? Pick a slot on our live calendar.
        </p>
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="calendly-inline-widget" data-url={BUSINESS.calendlyUrl} style={{ minWidth: "320px", height: "700px" }} />
        </div>
        <div className="mt-3 text-xs text-neutral-500">
          If the calendar doesn't load,{' '}
          <a className="text-indigo-700 underline" href={BUSINESS.calendlyUrl} target="_blank" rel="noreferrer">
            open it in a new tab
          </a>
          .
        </div>
      </section>

      {/* Contact / Quote */}
      <section id="contact" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Contact Us</h2>
            <p className="mt-2 text-sm text-neutral-700">
              Prefer to talk now? Tap call. Otherwise, leave your details and we’ll get back to you fast.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href={`tel:${BUSINESS.phone.replace(/[^0-9]/g, "")}`} className="rounded-xl px-4 py-2 bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700">
                Call {BUSINESS.phone}
              </a>
              <span className="self-center text-sm text-neutral-600">or leave your details below</span>
            </div>

            {formStatus === "success" && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Thanks! Your request was sent. We’ll contact you soon.
              </div>
            )}

            <form
              className="mt-6 grid gap-4"
              onSubmit={handleSubmit}
              action={useFormspree ? `https://formspree.io/f/${BUSINESS.formspreeFormId}` : undefined}
              method={useFormspree ? "POST" : undefined}
              style={{ display: formStatus === "success" ? "none" : undefined }}
            >
              {/* Honeypot field to reduce spam; harmless in mailto mode */}
              <input type="text" name="_gotcha" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

              <Field id="name" name="name" label="Name" required />
              <Field id="email" name="email" label="Email" type="email" required />
              <Field id="phone" name="phone" label="Phone" type="tel" />
              <Field id="tapes" name="tapes" label="How many tapes?" type="number" min={0} defaultValue={tapes} />
              <div>
                <label htmlFor="message" className="text-sm font-medium">
                  Notes
                </label>
                <textarea
                  id="message"
                  name="message"
                  className="mt-1 w-full rounded-xl border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={4}
                  placeholder="When would you like to drop off? Any special requests?"
                />
              </div>
              {useFormspree && (
                <>
                  <input type="hidden" name="avg_runtime_per_tape_min" value={runtimeMins} />
                  <input type="hidden" name="selected_add_ons" value={selectedAddOns.join(", ")} />
                  <input type="hidden" name="estimated_total" value={calc.subtotal.toFixed(2)} />
                </>
              )}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2 bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
                >
                  Email request
                </button>
                <a className="text-sm underline decoration-indigo-500 decoration-2 underline-offset-4" href={`mailto:${BUSINESS.email}`}>
                  Or write us directly
                </a>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Details</h3>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              <li>
                <b>Service area:</b> {BUSINESS.city}
              </li>
              <li>
                <b>Hours:</b> {BUSINESS.hours}
              </li>
              <li>
                <b>Turnaround:</b> {BUSINESS.turnaround}
              </li>
              <li>
                <b>Drop‑off:</b> {BUSINESS.addressNote}
              </li>
              <li>
                <b>Contact:</b> <a className="text-indigo-700" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> ·{' '}
                <a className="text-indigo-700" href={`tel:${BUSINESS.phone.replace(/[^\d]/g, "")}`}>{BUSINESS.phone}</a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="text-sm font-semibold">Service terms</h4>
              <ul className="mt-2 list-disc pl-5 text-xs leading-relaxed text-neutral-600">
                <li>No copyrighted material unless you are the rights holder.</li>
                <li>Transfers are done “as‑is”; tape age/condition may affect results.</li>
                <li>We are not liable for pre‑existing tape damage or degradation.</li>
                <li>Digital files retained 14 days post‑delivery, then permanently deleted.</li>
                <li>Unclaimed tapes may be discarded after 30 days of no response.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 text-sm text-neutral-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-medium text-neutral-800">{BUSINESS.name}</div>
            <div className="text-xs">© {new Date().getFullYear()} All rights reserved.</div>
          </div>
          <div className="space-x-4">
            <a href="#faq" className="hover:text-neutral-900">
              FAQ
            </a>
            <a href="#contact" className="hover:text-neutral-900">
              Contact
            </a>
            <a
              href="#"
              className="hover:text-neutral-900"
              onClick={(e) => {
                e.preventDefault();
                window.alert("Add a Privacy Policy page before you go live.");
              }}
            >
              Privacy
            </a>
            <a
              href="#"
              className="hover:text-neutral-900"
              onClick={(e) => {
                e.preventDefault();
                window.alert("Add a Terms of Service page before you go live.");
              }}
            >
              Terms
            </a>
          </div>
        </div>
      </footer>

      {/* Floating CTA */}
      <a
        href="#book"
        className="fixed bottom-5 right-5 rounded-full bg-indigo-600 text-white px-4 py-2 text-sm font-medium shadow-lg hover:bg-indigo-700"
      >
        Book now
      </a>
    </div>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-semibold">
          {n}
        </div>
        <div className="font-semibold">{title}</div>
      </div>
      <p className="mt-3 text-sm text-neutral-700">{children}</p>
    </div>
  );
}

function Feature({ title, children }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="font-semibold">{title}</div>
      <p className="mt-2 text-sm text-neutral-700">{children}</p>
    </div>
  );
}

function Faq({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group p-4">
      <summary className="cursor-pointer flex items-center justify-between gap-3 list-none">
        <span className="font-medium text-neutral-900">{q}</span>
        <span className="text-neutral-500">{open ? "–" : "+"}</span>
      </summary>
      <div className="mt-2 text-sm text-neutral-700">{children}</div>
    </details>
  );
}

function Line({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <div className={"text-neutral-600 " + (bold ? "font-semibold text-neutral-900" : "")}>{label}</div>
      <div className={"tabular-nums " + (bold ? "font-semibold text-neutral-900" : "text-neutral-900")}>{value}</div>
    </div>
  );
}

function Field({ id, label, type = "text", required = false, min, defaultValue, name }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={id}
        name={name || id}
        type={type}
        min={min}
        defaultValue={defaultValue}
        required={required}
        className="mt-1 w-full rounded-xl border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function NumberField({ label, value, onChange, min = 0 }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-9 w-9 rounded-lg border border-neutral-300 hover:bg-neutral-100"
          aria-label={`Decrease ${label}`}
        >
          –
        </button>
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full rounded-xl border border-neutral-300 p-2 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="h-9 w-9 rounded-lg border border-neutral-300 hover:bg-neutral-100"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-600 align-middle" />;
}
