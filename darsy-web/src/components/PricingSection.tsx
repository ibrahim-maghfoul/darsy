"use client";

import { useState, useEffect } from "react";
import { Check, X, Crown, Zap, BookOpen } from "lucide-react";
import { motion, AnimatePresence, useAnimationControls, type Variants } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

// ─── Payment config ───────────────────────────────────────────────────────────
const WHATSAPP     = "212640154580";
const BANK_NAME    = "BANQUE POPULAIRE";
const ACCOUNT_NAME = "Darsy";
const ACCOUNT_RIB  = "1813 3021 2112 9405 3800 0459";
// ─────────────────────────────────────────────────────────────────────────────

type Cycle = "monthly" | "yearly";
type PaidPlan = "pro" | "premium";

// Yearly = monthly × 12 × 0.85 (−15%)
const PRICES: Record<PaidPlan, Record<Cycle, number>> = {
  pro:     { monthly: 200, yearly: 2040 },
  premium: { monthly: 300, yearly: 3060 },
};

// ─── Modal animation variants ─────────────────────────────────────────────────
const MODAL_WRAP: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } },
};
const MODAL_ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};
const makeListItem = (rtl: boolean): Variants => ({
  hidden: { opacity: 0, x: rtl ? 10 : -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
});

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({
  plan,
  cycle,
  onClose,
}: {
  plan: PaidPlan;
  cycle: Cycle;
  onClose: () => void;
}) {
  const t        = useTranslations("Payment");
  const pt       = useTranslations("Pricing");
  const locale   = useLocale();
  const isRTL    = locale === "ar";
  const LIST_ITEM = makeListItem(isRTL);
  const [copied, setCopied] = useState(false);

  const amount    = PRICES[plan][cycle];
  const planName  = plan === "pro" ? pt("pro_name") : pt("premium_name");
  const cycleUnit = cycle === "monthly" ? pt("month") : pt("year");

  const handleCopy = () => {
    navigator.clipboard.writeText(ACCOUNT_RIB.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const waText = encodeURIComponent(
    `Salam! Je voudrais m'abonner au plan ${planName} (${amount} DH/${cycleUnit}).\n\nMon nom d'utilisateur: [votre nom]\nAbonnement souhaité: ${planName}`
  );
  const waLink = `https://wa.me/${WHATSAPP}?text=${waText}`;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.97 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        dir={isRTL ? "rtl" : "ltr"}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-7 relative max-h-[92vh] overflow-y-auto border-2 border-green/45 shadow-[0_20px_80px_rgba(58,170,106,0.22),0_0_0_4px_rgba(58,170,106,0.06)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Dots + lines texture */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-t-3xl sm:rounded-3xl pointer-events-none select-none overflow-hidden"
          style={{
            backgroundImage: [
              "radial-gradient(rgba(58,170,106,0.55) 1.4px, transparent 1.6px)",
              "repeating-linear-gradient(0deg,   rgba(58,170,106,0.09) 0, rgba(58,170,106,0.09) 1px, transparent 0, transparent 20px)",
              "repeating-linear-gradient(90deg,  rgba(58,170,106,0.09) 0, rgba(58,170,106,0.09) 1px, transparent 0, transparent 20px)",
            ].join(", "),
            backgroundSize: "20px 20px",
            opacity: 0.3,
          }}
        />
        {/* Top green glow */}
        <div
          aria-hidden
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-24 pointer-events-none select-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(58,170,106,0.18) 0%, transparent 70%)" }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close"
          className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} w-9 h-9 flex items-center justify-center rounded-full bg-green/15 hover:bg-green/30 active:scale-95 transition-all text-green hover:text-green z-50 cursor-pointer border border-green/20`}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Animated content */}
        <motion.div
          variants={MODAL_WRAP}
          initial="hidden"
          animate="visible"
          className="relative z-10"
        >
          {/* Header */}
          <motion.div variants={MODAL_ITEM} className={`mb-6 ${isRTL ? "pl-8" : "pr-8"}`}>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                plan === "premium"
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-green/10 text-green border border-green/20"
              }`}
            >
              <Crown size={11} />
              {planName} · {amount} DH / {cycleUnit}
            </div>
            <h3 className="text-xl font-bold text-dark">
              {t("modal_title", { plan: planName })}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{t("modal_subtitle")}</p>
          </motion.div>

          {/* Bank transfer block */}
          <motion.div variants={MODAL_ITEM} className="rounded-2xl border border-green/15 bg-green/[0.03] p-4 mb-4">
            <p className="text-[11px] font-bold text-green/70 uppercase tracking-widest mb-2">
              {t("transfer_heading")}
            </p>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              {t("transfer_instruction", { bank: BANK_NAME, account: ACCOUNT_NAME })}
            </p>
            <div className="rounded-xl bg-white border border-green/20 p-3.5 shadow-[0_2px_12px_rgba(58,170,106,0.07)]">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                {BANK_NAME}
              </div>
              <div className="text-sm font-bold text-dark mb-2">{ACCOUNT_NAME}</div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[13px] text-dark tracking-wide leading-snug">
                  {ACCOUNT_RIB}
                </span>
                <button
                  onClick={handleCopy}
                  className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all ${
                    copied
                      ? "bg-green/10 text-green"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
            </div>
          </motion.div>

          {/* WhatsApp instructions */}
          <motion.div variants={MODAL_ITEM} className="rounded-2xl border border-green/20 bg-green/5 p-4 mb-6">
            <p className="text-[11px] font-bold text-green uppercase tracking-widest mb-2">
              {t("whatsapp_heading")}
            </p>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {t("whatsapp_instruction")}
            </p>
            <motion.ul
              variants={MODAL_WRAP}
              className="space-y-2"
            >
              {(["item_receipt", "item_username", "item_plan"] as const).map(k => (
                <motion.li key={k} variants={LIST_ITEM} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded-full bg-green/15 flex items-center justify-center flex-shrink-0">
                    <Check size={9} className="text-green" strokeWidth={3} />
                  </span>
                  {t(k)}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* WhatsApp CTA */}
          <motion.a
            variants={MODAL_ITEM}
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1fbd5a] active:scale-[0.98] text-white font-bold text-[15px] py-4 rounded-2xl transition-all shadow-[0_4px_20px_rgba(37,211,102,0.35)]"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            {t("wa_btn")}
          </motion.a>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Animation variants ───────────────────────────────────────────────────────
const CARD_VARS: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ─── Pricing Section ──────────────────────────────────────────────────────────
export function PricingSection() {
  const t      = useTranslations("Pricing");
  const pt     = useTranslations("Payment");
  const locale = useLocale();
  const isRTL  = locale === "ar";

  const [cycle, setCycle]           = useState<Cycle>("monthly");
  const [activePlan, setActivePlan] = useState<PaidPlan | null>(null);

  const ctrl0 = useAnimationControls();
  const ctrl1 = useAnimationControls();
  const ctrl2 = useAnimationControls();
  const ctrls = [ctrl0, ctrl1, ctrl2];

  useEffect(() => {
    ctrls.forEach((ctrl, i) => {
      setTimeout(() => {
        ctrl.start({
          x: [0, -7, 7, -4, 4, -2, 2, 0],
          transition: { duration: 0.4, ease: "easeOut" },
        });
      }, i * 55);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const plans = [
    {
      key:         "free" as const,
      name:        t("free_name"),
      desc:        t("free_desc"),
      price:       "0",
      priceSuffix: t("forever"),
      badge:       null,
      variant:     "free" as const,
      features:    [t("f1"), t("f2"), t("f3"), t("f4"), t("ni3")],
      aiLabel:     t("ai_free"),
      cta:         pt("free_cta"),
    },
    {
      key:         "pro" as const,
      name:        t("pro_name"),
      desc:        t("pro_desc"),
      price:       String(PRICES.pro[cycle]),
      priceSuffix: cycle === "monthly" ? pt("per_month") : pt("per_year"),
      badge:       t("most_popular"),
      variant:     "pro" as const,
      features:    [t("f12"), t("f6"), t("f21"), t("f8"), t("f10"), t("f9")],
      aiLabel:     t("ai_pro"),
      cta:         pt("subscribe_cta"),
    },
    {
      key:         "premium" as const,
      name:        t("premium_name"),
      desc:        t("premium_desc"),
      price:       String(PRICES.premium[cycle]),
      priceSuffix: cycle === "monthly" ? pt("per_month") : pt("per_year"),
      badge:       t("best_value"),
      variant:     "premium" as const,
      features:    [t("f13"), t("f22"), t("f14"), t("f15"), t("f9"), t("f17"), t("f18")],
      aiLabel:     t("ai_premium"),
      cta:         pt("subscribe_cta"),
    },
  ];

  return (
    <section dir={isRTL ? "rtl" : "ltr"} className="bg-[#f8faf8] py-[60px] md:py-[100px] px-[clamp(20px,6vw,80px)] md:px-[clamp(24px,8vw,120px)]">
      <div className="max-w-6xl mx-auto">

        {/* Section heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green/30 bg-green/5 text-[12px] font-semibold text-green/80 shadow-[0_0_12px_rgba(58,170,106,0.12)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            {pt("kicker")}
          </div>
          <h2 className="text-[clamp(30px,5vw,54px)] font-bold text-dark tracking-[-0.03em] leading-[1.1]">
            {pt("title")}{" "}
            <span className="text-green">{pt("title2")}</span>
          </h2>
          <p className="mt-4 text-[15px] text-gray-500 max-w-lg mx-auto leading-relaxed">
            {pt("desc")}
          </p>
        </div>

        {/* Monthly / yearly toggle */}
        <div className="flex flex-col items-center gap-2 mb-10">
          <div className="relative flex items-center bg-white border border-green/20 shadow-[0_2px_12px_rgba(58,170,106,0.08)] rounded-xl p-1 overflow-hidden">
            {/* Switcher texture */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(58,170,106,0.05) 0, rgba(58,170,106,0.05) 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, rgba(58,170,106,0.05) 0, rgba(58,170,106,0.05) 1px, transparent 0, transparent 50%)",
                backgroundSize: "10px 10px",
              }}
            />
            <motion.span
              layout
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className={`absolute top-1 h-[calc(100%-8px)] rounded-lg bg-green shadow-[0_2px_8px_rgba(58,170,106,0.3)] ${
                isRTL
                  ? cycle === "monthly" ? "right-1 left-[50%]" : "right-[50%] left-1"
                  : cycle === "monthly" ? "left-1 right-[50%]" : "left-[50%] right-1"
              }`}
            />
            <button
              onClick={() => setCycle("monthly")}
              className={`relative z-10 px-7 py-2 rounded-lg text-sm font-semibold transition-colors ${
                cycle === "monthly" ? "text-white" : "text-dark/50 hover:text-dark/80"
              }`}
            >
              {pt("monthly")}
            </button>
            <button
              onClick={() => setCycle("yearly")}
              className={`relative z-10 px-7 py-2 rounded-lg text-sm font-semibold transition-colors ${
                cycle === "yearly" ? "text-white" : "text-dark/50 hover:text-dark/80"
              }`}
            >
              {pt("yearly")}
            </button>
          </div>
          <div className="h-6 flex items-center">
            <AnimatePresence>
              {cycle === "yearly" && (
                <motion.span
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green"
                >
                  <Zap size={11} className="text-green flex-shrink-0" strokeWidth={2.5} fill="currentColor" />
                  {pt("save_badge")}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:items-start py-6">
          {plans.map((plan, i) => {
            const rotation = i === 0 ? -4 : i === 2 ? 4 : 0;
            return (
              <motion.div key={`${plan.key}-${locale}`} animate={ctrls[i]} style={{ zIndex: i === 1 ? 2 : 1 }}>
              <motion.div
                custom={i}
                variants={CARD_VARS}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                style={{ rotate: rotation }}
                className={`relative rounded-3xl px-7 pb-7 pt-10 flex flex-col ${
                  plan.variant === "pro"
                    ? "bg-white border-2 border-green shadow-[0_10px_48px_rgba(58,170,106,0.22)]"
                    : plan.variant === "premium"
                    ? "bg-dark text-white shadow-[0_10px_48px_rgba(0,0,0,0.4)]"
                    : "bg-white border border-gray-200 shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
                }`}
              >
                {/* Texture — unique per card, clipped to card shape */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                  {plan.variant === "free" && (
                    /* Square dot grid */
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: "radial-gradient(rgba(0,0,0,0.065) 1.5px, transparent 1.5px)",
                        backgroundSize: "20px 20px",
                      }}
                    />
                  )}
                  {plan.variant === "pro" && (
                    /* Diagonal cross-hatch lines */
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(45deg, rgba(58,170,106,0.08) 0, rgba(58,170,106,0.08) 1px, transparent 0, transparent 50%), repeating-linear-gradient(-45deg, rgba(58,170,106,0.08) 0, rgba(58,170,106,0.08) 1px, transparent 0, transparent 50%)",
                        backgroundSize: "16px 16px",
                      }}
                    />
                  )}
                  {plan.variant === "premium" && (
                    /* Hexagonal honeycomb dots */
                    <>
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)",
                          backgroundSize: "22px 38px",
                          backgroundPosition: "0 0, 11px 19px",
                        }}
                      />
                      <div
                        className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-52"
                        style={{
                          background: "radial-gradient(ellipse at 50% 20%, rgba(58,170,106,0.25) 0%, transparent 68%)",
                        }}
                      />
                    </>
                  )}
                </div>

                {/* Top circle icon badge */}
                <div
                  className={`absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                    plan.variant === "pro"
                      ? "bg-green shadow-[0_4px_16px_rgba(58,170,106,0.55)]"
                      : plan.variant === "premium"
                      ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_4px_16px_rgba(245,158,11,0.5)]"
                      : "bg-white border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.09)]"
                  }`}
                >
                  {plan.variant === "pro"     && <Zap      size={17} className="text-white"    strokeWidth={2.5} />}
                  {plan.variant === "premium" && <Crown    size={17} className="text-white"    strokeWidth={2.5} />}
                  {plan.variant === "free"    && <BookOpen size={16} className="text-gray-400" strokeWidth={2}   />}
                </div>

                {/* Hanging side badge */}
                {plan.badge && (
                  <div className={`absolute ${isRTL ? "-left-1" : "-right-1"} top-10 z-10 flex items-center`}>
                    <div
                      className={`pl-3.5 pr-4 py-1.5 text-white text-[10px] font-bold tracking-wide ${isRTL ? "rounded-r-full" : "rounded-l-full"} ${
                        plan.variant === "pro"
                          ? "bg-green shadow-[0_3px_14px_rgba(58,170,106,0.55)]"
                          : "bg-amber-500 shadow-[0_3px_14px_rgba(245,158,11,0.55)]"
                      }`}
                    >
                      {plan.badge}
                    </div>
                    <div
                      className={`w-0 h-0 border-y-[11px] border-y-transparent ${isRTL ? "border-r-[7px]" : "border-l-[7px]"} ${
                        plan.variant === "pro"
                          ? isRTL ? "border-r-green" : "border-l-green"
                          : isRTL ? "border-r-amber-500" : "border-l-amber-500"
                      }`}
                    />
                  </div>
                )}

                {/* Plan info */}
                <div className="mb-5 mt-1">
                  <div
                    className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${
                      plan.variant === "premium" ? "text-white/40" : "text-gray-400"
                    }`}
                  >
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1 overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={plan.price}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: "inline-block" }}
                        className={`text-[44px] font-bold leading-none tracking-tight ${
                          plan.variant === "premium" ? "text-white" : "text-dark"
                        }`}
                      >
                        {plan.price}
                      </motion.span>
                    </AnimatePresence>
                    <motion.span
                      key={plan.priceSuffix}
                      initial={false}
                      animate={{ opacity: 1 }}
                      className={`text-sm ml-1 ${
                        plan.variant === "premium" ? "text-white/50" : "text-gray-400"
                      }`}
                    >
                      {plan.priceSuffix}
                    </motion.span>
                  </div>
                  <p
                    className={`text-xs mt-2.5 leading-relaxed ${
                      plan.variant === "premium" ? "text-white/50" : "text-gray-500"
                    }`}
                  >
                    {plan.desc}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-4 flex-1">
                  {plan.features.map((f, fi) => (
                    <li key={`${plan.key}-${fi}`} className="flex items-start gap-2.5 text-sm">
                      <Check
                        size={14}
                        className={`mt-0.5 flex-shrink-0 ${
                          plan.variant === "premium" || plan.variant === "pro"
                            ? "text-green"
                            : "text-gray-400"
                        }`}
                        strokeWidth={2.5}
                      />
                      <span className={plan.variant === "premium" ? "text-white/75" : "text-gray-600"}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* AI chip */}
                <div
                  className={`mb-5 flex items-center gap-2 px-3 py-2 rounded-xl ${
                    plan.variant === "premium"
                      ? "bg-white/10 border border-white/10"
                      : "bg-violet-50 border border-violet-100"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 flex-shrink-0">
                    <path d="M12 2l2.4 7.2H22l-6.2 4.5 2.4 7.2L12 16.5l-6.2 4.4 2.4-7.2L2 9.2h7.6z" fill="#8b5cf6"/>
                  </svg>
                  <span className={`text-xs font-semibold ${
                    plan.variant === "premium" ? "text-violet-300" : "text-violet-600"
                  }`}>
                    {plan.aiLabel}
                  </span>
                </div>

                {/* CTA */}
                <div>
                  {plan.key === "free" ? (
                    <Link
                      href="/explore"
                      className="block text-center py-3.5 px-6 rounded-2xl font-semibold text-sm border border-gray-200 text-gray-600 hover:border-green hover:text-green transition-colors"
                    >
                      {plan.cta}
                    </Link>
                  ) : (
                    <button
                      onClick={() => setActivePlan(plan.key as PaidPlan)}
                      className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] ${
                        plan.variant === "pro"
                          ? "bg-green text-white hover:bg-green/90 shadow-[0_4px_20px_rgba(58,170,106,0.35)]"
                          : "bg-white text-dark hover:bg-white/90 shadow-[0_4px_20px_rgba(0,0,0,0.12)]"
                      }`}
                    >
                      {plan.cta}
                    </button>
                  )}
                </div>
              </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Payment modal */}
      <AnimatePresence>
        {activePlan && (
          <PaymentModal
            plan={activePlan}
            cycle={cycle}
            onClose={() => setActivePlan(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
