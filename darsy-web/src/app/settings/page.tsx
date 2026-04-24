"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Settings,
    User,
    Bell,
    Monitor,
    Shield,
    CreditCard,
    Plus,
    ChevronRight,
    ChevronLeft,
    Save,
    Loader2,
    GraduationCap,
    MapPin,
    Phone,
    Calendar,
    Users,
    Check,
    Sparkles,
    Zap,
    Star,
    Crown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import GradesCalculator from "@/components/GradesCalculator";

export default function SettingsPage() {
    const t = useTranslations("Settings");
    const tp = useTranslations("Profile");
    const { user, logout, checkAuth } = useAuth();
    const { showSnackbar } = useSnackbar();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("profile");
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
    const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [showGenderDropdown, setShowGenderDropdown] = useState(false);
    const [citySearch, setCitySearch] = useState("");

    const [formData, setFormData] = useState({
        displayName: user?.displayName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        age: user?.age || "",
        gender: user?.gender || "",
        nickname: user?.nickname || "",
        city: user?.city || "",
        schoolName: user?.schoolName || "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || "",
                email: user.email || "",
                phone: user.phone || "",
                age: user.age || "",
                gender: user.gender || "",
                nickname: user.nickname || "",
                city: user.city || "",
                schoolName: user.schoolName || "",
            });
            setCitySearch(user.city || "");
        }
    }, [user]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".city-dropdown-container") && !target.closest(".gender-dropdown-container")) {
                setShowCityDropdown(false);
                setShowGenderDropdown(false);
            }

        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const moroccanCities = [
        "Casablanca", "Rabat", "Marrakech", "Fes", "Tangier", "Agadir", "Meknes", "Oujda", "Kenitra", "Tetouan",
        "Safi", "Mohammedia", "Khouribga", "Beni Mellal", "El Jadida", "Taza", "Nador", "Settat", "Larache",
        "Ksar El Kebir", "Khemisset", "Guelmim", "Berrechid", "Oued Zem", "Fquih Ben Salah", "Taourirt",
        "Berkane", "Sidi Slimane", "Sidi Qacem", "Khenifra", "Taroudant", "Essaouira", "Tiznit", "Ouarzazate",
        "Errachidia", "Tan-Tan", "Sidi Ifni", "Dakhla", "Laayouine"
    ];

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            await checkAuth();
            await api.patch('/user/profile', formData);
            await checkAuth();
            showSnackbar(t("save_success"), "success");
        } catch (error: any) {
            showSnackbar(error.response?.data?.error || t("save_error"), "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setIsChangingPassword(true);
        try {
            await api.post('/user/change-password', passwordData);
            showSnackbar("Password changed successfully", "success");
            setPasswordData({ currentPassword: "", newPassword: "" });
        } catch (error: any) {
            showSnackbar(error.response?.data?.error || "Failed to change password", "error");
        } finally {
            setIsChangingPassword(false);
        }
    };


    const handleSubscribe = async (plan: string) => {
        setIsSubscribing(plan);
        try {
            await api.patch('/user/subscribe', { plan, billingCycle });
            await checkAuth();
            showSnackbar(`Successfully subscribed to ${plan} plan!`, "success");
        } catch (error: any) {
            showSnackbar(error.response?.data?.error || "Failed to update subscription", "error");
        } finally {
            setIsSubscribing(null);
        }
    };

    const pricingPlans = [
        {
            id: "free",
            name: "Free",
            price: 0,
            features: [
                "Navigate all courses",
                "Create and manage profile",
                "Community Q&A access"
            ],
            color: "gray"
        },
        {
            id: "premium",
            name: "Premium",
            monthlyPrice: 100,
            yearlyPrice: 900,
            features: [
                "All Free features",
                "Access to premium resources",
                "Attend live courses",
            ],
            color: "green",
            recommended: true
        },
        {
            id: "pro",
            name: "Pro",
            monthlyPrice: 200,
            yearlyPrice: 1900,
            features: [
                "All Premium benefits",
                "1 Hour direct contact with teacher",
                "Priority support"
            ],
            color: "dark"
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen pt-8 pb-12 px-[clamp(16px,5vw,48px)] bg-gradient-to-b from-white to-green/5"
        >
            <div className="max-w-4xl mx-auto space-y-12">
                <div className="space-y-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-dark/60 hover:text-dark text-xs font-black uppercase tracking-widest w-fit px-4 py-2 rounded-full border border-dark/15 hover:border-dark/30 hover:bg-dark/5 group transition-all"
                    >
                        <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                        {t("back")}
                    </button>
                    <h1 className="text-4xl font-bold tracking-tight text-dark flex items-center gap-4">
                        <Settings size={36} className="text-green" />
                        {t("title")}
                    </h1>
                </div>

                {/* Horizontal Tab Bar */}
                <div className="flex items-center gap-2 bg-green/5 p-1.5 rounded-2xl border border-green/10 overflow-x-auto">
                    {[
                        { id: "profile", label: t("personal_info"), icon: User },
                        { id: "security", label: t("security"), icon: Shield },
                        { id: "billing", label: t("billing"), icon: CreditCard },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeTab === item.id
                                ? "bg-green text-white shadow-lg shadow-green/20"
                                : "text-dark/60 hover:text-green hover:bg-white"
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Settings Content */}
                <div className="space-y-12 pb-20 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                {activeTab === "profile" && (
                                    /* Personal Info Section */
                                    <section id="profile" className="space-y-6">
                                        <div className="flex items-center justify-between border-b border-green/5 pb-4">
                                            <h2 className="text-2xl font-bold text-dark">{t("personal_info")}</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <User size={16} /> {t("profile")}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.displayName}
                                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                                    className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <Users size={16} /> Nickname
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.nickname}
                                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                                    className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                    placeholder="Your nickname"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <Bell size={16} /> {t("email")}
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent outline-none font-medium transition-all opacity-50 cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <Phone size={16} /> {t("phone")}
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                    placeholder="+212600000000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <Calendar size={16} /> {t("age")}
                                                </label>
                                                <input
                                                    type="number"
                                                    max="80"
                                                    value={formData.age}
                                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                                    className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2 relative gender-dropdown-container">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <User size={16} /> {t("gender")}
                                                </label>
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowGenderDropdown(!showGenderDropdown);
                                                            setShowCityDropdown(false)
                                                        }}
                                                        className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all text-left flex items-center justify-between"
                                                    >
                                                        <span className="flex items-center gap-2">
                                                            {formData.gender ? (
                                                                <>
                                                                    <span className="text-green font-bold">{formData.gender === 'male' ? '♂' : '♀'}</span>
                                                                    {t(formData.gender)}
                                                                </>
                                                            ) : (
                                                                <span className="text-dark/20">-</span>
                                                            )}
                                                        </span>
                                                        <ChevronRight size={18} className={`text-dark/20 transition-transform duration-300 ${showGenderDropdown ? 'rotate-90 text-green' : 'rotate-0'}`} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {showGenderDropdown && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-green/10 rounded-[24px] shadow-2xl shadow-green/10 overflow-hidden p-2"
                                                            >
                                                                {['male', 'female'].map((g) => (
                                                                    <button
                                                                        key={g}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, gender: g });
                                                                            setShowGenderDropdown(false);
                                                                        }}
                                                                        className="w-full px-6 py-3.5 text-left text-sm font-bold text-dark/70 hover:text-green hover:bg-green/5 rounded-2xl transition-all flex items-center justify-between group"
                                                                    >
                                                                        <span className="flex items-center gap-3">
                                                                            <span className="text-lg text-green font-black">{g === 'male' ? '♂' : '♀'}</span>
                                                                            {t(g)}
                                                                        </span>
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green scale-0 group-hover:scale-100 transition-transform" />
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <GraduationCap size={16} /> {t("school_name")}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.schoolName}
                                                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                                                    className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                    placeholder="Your school name"
                                                />
                                            </div>
                                            <div className="space-y-2 relative city-dropdown-container">
                                                <label className="text-sm font-bold text-dark/40 flex items-center gap-2">
                                                    <MapPin size={16} /> {t("city")}
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={citySearch}
                                                        onChange={(e) => {
                                                            setCitySearch(e.target.value);
                                                            setFormData({ ...formData, city: e.target.value });
                                                            setShowCityDropdown(true);
                                                            setShowGenderDropdown(false);
                                                        }}
                                                        onFocus={() => {
                                                            setShowCityDropdown(true);
                                                            setShowGenderDropdown(false);
                                                        }}
                                                        className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                        placeholder={t("select_city") || "Select your city"}
                                                    />
                                                    <ChevronRight size={18} className={`absolute right-5 top-1/2 -translate-y-1/2 text-dark/20 transition-transform duration-300 ${showCityDropdown ? 'rotate-90 text-green' : 'rotate-0'}`} />
                                                </div>

                                                <AnimatePresence>
                                                    {showCityDropdown && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-green/10 rounded-[32px] shadow-2xl shadow-green/10 overflow-hidden max-h-64 overflow-y-auto p-2"
                                                        >
                                                            {moroccanCities
                                                                .filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
                                                                .map(city => (
                                                                    <button
                                                                        key={city}
                                                                        onClick={() => {
                                                                            setFormData({ ...formData, city });
                                                                            setCitySearch(city);
                                                                            setShowCityDropdown(false);
                                                                        }}
                                                                        className="w-full px-6 py-3.5 text-left text-sm font-bold text-dark/70 hover:text-green hover:bg-green/5 rounded-2xl transition-all flex items-center justify-between group"
                                                                    >
                                                                        {city}
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green scale-0 group-hover:scale-100 transition-transform" />
                                                                    </button>
                                                                ))}
                                                            {moroccanCities.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).length === 0 && (
                                                                <div className="px-6 py-8 text-center text-muted-foreground italic text-sm">
                                                                    No cities found for "{citySearch}"
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex justify-end">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className="flex items-center gap-2 px-12 py-4 bg-green text-white font-bold rounded-2xl hover:bg-green/90 transition-all disabled:opacity-50 shadow-lg shadow-green/20"
                                            >
                                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                                {isSaving ? t("saving") : t("save_changes")}
                                            </button>
                                        </div>
                                    </section>
                                )}


                                {activeTab === "security" && (
                                    /* Security Section (Change Password) */
                                    <section id="security" className="space-y-6">
                                        <h2 className="text-2xl font-bold text-dark border-b border-green/5 pb-4">{t("security")}</h2>
                                        <div className="p-8 rounded-[32px] border border-green/10 bg-white space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-dark/40">{t("current_password")}</label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.currentPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                        className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-bold text-dark/40">{t("new_password")}</label>
                                                    <input
                                                        type="password"
                                                        value={passwordData.newPassword}
                                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                        className="w-full px-5 py-3 rounded-2xl bg-green/5 border border-transparent focus:bg-white focus:border-green outline-none font-medium transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={isChangingPassword}
                                                className="px-8 py-3 bg-dark text-white font-bold rounded-xl hover:bg-dark/90 transition-all disabled:opacity-50"
                                            >
                                                {isChangingPassword ? <Loader2 size={18} className="animate-spin" /> : t("change_password")}
                                            </button>
                                        </div>
                                    </section>
                                )}

                                {activeTab === "billing" && (
                                    /* Billing Section */
                                    <section id="billing" className="space-y-12">
                                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-green/5 pb-6">
                                            <div className="space-y-2">
                                                <h2 className="text-2xl font-bold text-dark">{t("billing")}</h2>
                                                <p className="text-muted-foreground">Manage your subscription and billing details.</p>
                                            </div>

                                            {/* Monthly/Yearly Toggle */}
                                            <div className="flex items-center gap-2 bg-green/5 p-1.5 rounded-2xl border border-green/10">
                                                <button
                                                    onClick={() => setBillingCycle("monthly")}
                                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-white text-green shadow-sm" : "text-dark/40 hover:text-green"}`}
                                                >
                                                    Monthly
                                                </button>
                                                <button
                                                    onClick={() => setBillingCycle("yearly")}
                                                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === "yearly" ? "bg-white text-green shadow-sm" : "text-dark/40 hover:text-green"}`}
                                                >
                                                    Yearly <span className="text-[10px] bg-green/10 px-1.5 py-0.5 rounded-full ml-1">Save 20%</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 items-start">
                                            {([
                                                {
                                                    id: "free",
                                                    name: "Free",
                                                    tagline: "Get started for free",
                                                    price: "0",
                                                    numPrice: 0,
                                                    period: "forever",
                                                    icon: Sparkles,
                                                    isPremium: false,
                                                    borderColor: "border-green/20",
                                                    accentColor: "#3aaa6a",
                                                    badge: null,
                                                    badgeClass: "",
                                                    features: [
                                                        "50k+ free lessons",
                                                        "Basic progress tracking",
                                                        "Community chat access",
                                                        "Mobile app access",
                                                    ]
                                                },
                                                {
                                                    id: "pro",
                                                    name: "Pro",
                                                    tagline: "For serious learners",
                                                    price: billingCycle === 'monthly' ? "100" : "900",
                                                    numPrice: billingCycle === 'monthly' ? 100 : 900,
                                                    period: billingCycle === 'monthly' ? "/ month" : "/ year",
                                                    icon: Zap,
                                                    isPremium: false,
                                                    borderColor: "border-green/60",
                                                    accentColor: "#3aaa6a",
                                                    badge: "Most Popular",
                                                    badgeClass: "bg-green text-white shadow-green/20",
                                                    features: [
                                                        "Everything in Free",
                                                        "Premium lesson library",
                                                        "No ads — ever",
                                                        "100 offline downloads",
                                                        "Progress analytics",
                                                        "AI explanations (multilingual)",
                                                        "Priority support",
                                                    ]
                                                },
                                                {
                                                    id: "premium",
                                                    name: "Premium",
                                                    tagline: "The complete Darsy experience",
                                                    price: billingCycle === 'monthly' ? "200" : "1900",
                                                    numPrice: billingCycle === 'monthly' ? 200 : 1900,
                                                    period: billingCycle === 'monthly' ? "/ month" : "/ year",
                                                    icon: Crown,
                                                    isPremium: true,
                                                    borderColor: "border-[#D4AF37]/30",
                                                    accentColor: "#D4AF37",
                                                    badge: "Best Value",
                                                    badgeClass: "bg-gradient-to-r from-[#D4AF37] to-[#F9D423] text-white shadow-[#D4AF37]/30",
                                                    features: [
                                                        "Everything in Pro",
                                                        "Unlimited downloads",
                                                        "1-on-1 mentoring sessions",
                                                        "Early access to new features",
                                                        "Dedicated success manager",
                                                    ]
                                                }
                                            ] as const).map((plan) => {
                                                const isCurrentPlan = user?.subscription?.plan === plan.id;
                                                const PlanIcon = plan.icon;
                                                return (
                                                    <div
                                                        key={plan.id}
                                                        className={`relative bg-white flex flex-col rounded-[36px] border-2 ${plan.borderColor} p-8 shadow-xl transition-all duration-300 group ${isCurrentPlan ? "md:-translate-y-3 md:scale-[1.02]" : ""} ${plan.id === "pro" ? "md:-translate-y-2" : ""}`}
                                                    >
                                                        {/* Badge */}
                                                        {plan.badge && (
                                                            <div className={`absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-full shadow-lg whitespace-nowrap ${plan.badgeClass}`}>
                                                                {plan.badge}
                                                            </div>
                                                        )}

                                                        {/* Contour animation */}
                                                        <div
                                                            className="pointer-events-none absolute inset-0 rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                            style={{
                                                                border: `1.5px solid ${plan.accentColor}`,
                                                                clipPath: 'inset(0 50% 100% 0)',
                                                                transition: 'opacity 0.3s, clip-path 0.45s cubic-bezier(0.34,1.2,0.64,1)',
                                                            }}
                                                        />
                                                        <div
                                                            className="pointer-events-none absolute inset-0 rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                            style={{
                                                                border: `1.5px solid ${plan.accentColor}`,
                                                                clipPath: 'inset(0 0 100% 50%)',
                                                                transition: 'opacity 0.3s, clip-path 0.45s cubic-bezier(0.34,1.2,0.64,1) 0.05s',
                                                            }}
                                                        />

                                                        <div className="flex flex-col flex-1">
                                                            {/* Header */}
                                                            <div className="flex items-start justify-between mb-5">
                                                                <div
                                                                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                                                    style={plan.isPremium
                                                                        ? { background: 'linear-gradient(135deg, #D4AF37, #F9D423)', boxShadow: '0 6px 20px rgba(212,175,55,0.3)' }
                                                                        : { background: `${plan.accentColor}15` }
                                                                    }
                                                                >
                                                                    <PlanIcon size={20} style={{ color: plan.isPremium ? '#fff' : plan.accentColor }} />
                                                                </div>
                                                                {isCurrentPlan && (
                                                                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-green/10 text-green border border-green/20">
                                                                        ✓ Current
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Name & tagline */}
                                                            <h3 className="text-2xl font-black text-dark mb-1">{plan.name}</h3>
                                                            <p className="text-xs font-medium text-dark/40 mb-6">{plan.tagline}</p>

                                                            {/* Price */}
                                                            <div className="flex items-end gap-1 mb-6">
                                                                <span
                                                                    className="text-[52px] font-black leading-none tracking-tight tabular-nums"
                                                                    style={{ color: plan.isPremium ? '#D4AF37' : plan.accentColor }}
                                                                >
                                                                    {plan.price}
                                                                </span>
                                                                <div className="flex flex-col mb-2 gap-0.5">
                                                                    <span className="text-sm font-bold text-dark/40">DH</span>
                                                                    <span className="text-[11px] text-dark/30">{plan.period}</span>
                                                                </div>
                                                            </div>

                                                            {/* Divider */}
                                                            <div className="h-px mb-5 bg-dark/[0.05]" />

                                                            {/* Features */}
                                                            <div className="space-y-3 flex-1 mb-7">
                                                                {plan.features.map((f, j) => (
                                                                    <div key={j} className="flex items-center gap-3">
                                                                        <div
                                                                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                                                            style={{ background: `${plan.accentColor}15` }}
                                                                        >
                                                                            <Check size={10} strokeWidth={3} style={{ color: plan.accentColor }} />
                                                                        </div>
                                                                        <span className="text-[12.5px] font-medium text-dark/60">{f}</span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* CTA */}
                                                            <button
                                                                disabled
                                                                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 cursor-not-allowed transition-all ${
                                                                    isCurrentPlan
                                                                        ? plan.isPremium
                                                                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9D423] text-white shadow-lg shadow-[#D4AF37]/20'
                                                                            : 'bg-green text-white shadow-lg shadow-green/20'
                                                                        : 'bg-green/5 text-green/50 border border-green/15'
                                                                }`}
                                                            >
                                                                {isCurrentPlan
                                                                    ? <><Check size={14} strokeWidth={3} /> Current Plan</>
                                                                    : "Coming Soon"
                                                                }
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div
                                            className="p-8 rounded-[28px] text-white text-center space-y-4 shadow-2xl relative overflow-hidden group"
                                            style={{ background: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0px,rgba(255,255,255,0.03) 2px,transparent 2px,transparent 8px),linear-gradient(135deg,#1e7a46 0%,#0f4428 100%)' }}
                                        >
                                            <div className="relative z-10 flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                    <CreditCard size={32} className="text-white" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-2xl font-black">{t("subscription_management")}</h3>
                                                    <p className="max-w-md mx-auto text-white/60 font-medium">
                                                        {t("coming_soon")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </motion.div>
                        </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
