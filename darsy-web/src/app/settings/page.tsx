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
    Save,
    Loader2,
    GraduationCap,
    MapPin,
    Phone,
    Calendar,
    Users
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
                        className="flex items-center gap-3 px-6 py-3 bg-white border border-green/10 rounded-2xl text-lg font-bold text-dark/60 hover:text-green hover:border-green hover:shadow-lg hover:shadow-green/5 transition-all group"
                    >
                        <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
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

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
                                            {[
                                                {
                                                    name: "Free",
                                                    price: "0",
                                                    period: tp('forever') || "forever",
                                                    description: "Perfect for students just starting out",
                                                    color: "border-green/20",
                                                    buttonStyle: "bg-green/5 text-green border border-green/20",
                                                    badge: null,
                                                    id: "free",
                                                    features: [
                                                        "Access to 50k+ free lessons",
                                                        "Basic progress tracking",
                                                        "Community forum access",
                                                        "Mobile app access",
                                                        "Email support",
                                                    ]
                                                },
                                                {
                                                    name: "Pro",
                                                    price: billingCycle === 'monthly' ? "100" : "900",
                                                    period: billingCycle === 'monthly' ? "month" : "year",
                                                    description: "For serious learners who want everything",
                                                    color: "border-green/60",
                                                    buttonStyle: "bg-green text-white shadow-lg shadow-green/20",
                                                    badge: "Most Popular",
                                                    id: "pro",
                                                    features: [
                                                        "Access premium lessons",
                                                        "No ads",
                                                        "Offline downloads",
                                                        "Everything in Free",
                                                        "Full lesson library",
                                                        "Progress analytics",
                                                        "Priority support",
                                                    ]
                                                },
                                                {
                                                    name: "Premium",
                                                    price: billingCycle === 'monthly' ? "200" : "1900",
                                                    period: billingCycle === 'monthly' ? "month" : "year",
                                                    description: "The complete Darsy experience",
                                                    color: "border-[#D4AF37]/30",
                                                    buttonStyle: "bg-gradient-to-r from-[#D4AF37] to-[#F9D423] text-white",
                                                    badge: "Best Value",
                                                    isPremium: true,
                                                    id: "premium",
                                                    features: [
                                                        "Everything in Pro",
                                                        "Unlimited offline downloads",
                                                        "1-on-1 mentoring sessions",
                                                        "Early access to new features",
                                                        "Dedicated success manager",
                                                    ]
                                                }
                                            ].map((plan) => (
                                                <div
                                                    key={plan.id}
                                                    className={`relative p-8 rounded-[36px] border-2 ${plan.color} bg-white shadow-xl flex flex-col transition-all duration-300 ${plan.id === user?.subscription?.plan ? "scale-[1.02] ring-4 ring-green/10" : ""}`}
                                                >
                                                    {plan.badge && (
                                                        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-black rounded-full shadow-lg ${plan.isPremium ? 'bg-gradient-to-r from-[#D4AF37] to-[#F9D423] text-white' : 'bg-green text-white'}`}>
                                                            {plan.badge}
                                                        </div>
                                                    )}

                                                    <div className="space-y-2 mb-6 text-center">
                                                        <h3 className="text-xl font-black text-dark">{plan.name}</h3>
                                                        <p className="text-muted-foreground text-[11px] leading-tight">{plan.description}</p>
                                                    </div>

                                                    <div className="flex flex-col mb-8 text-center items-center">
                                                        <div className="flex items-end gap-1">
                                                            <span className={`text-4xl font-black leading-none ${plan.isPremium ? 'text-[#D4AF37]' : 'text-dark'}`}>{plan.price}</span>
                                                            <span className="text-muted-foreground font-bold text-sm">DH</span>
                                                            <span className="text-muted-foreground font-medium text-[10px] mb-1">/{plan.period}</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-4 flex-1 mb-8">
                                                        {plan.features.map((f, j) => (
                                                            <div key={j} className="flex items-start gap-3">
                                                                <div className="mt-1 w-4 h-4 rounded-full bg-green/10 flex items-center justify-center shrink-0">
                                                                    <Plus size={10} className="text-green font-black" />
                                                                </div>
                                                                <span className="text-[12px] text-dark/70 font-medium">{f}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button
                                                        disabled={true}
                                                        className={`w-full py-4 rounded-2xl font-black text-sm text-center flex items-center justify-center gap-2 opacity-60 cursor-not-allowed ${plan.buttonStyle}`}
                                                    >
                                                        {user?.subscription?.plan === plan.id ? "Current Plan" : "Coming Soon"}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-8 rounded-[32px] bg-dark text-white text-center space-y-4 shadow-2xl shadow-dark/20 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-[url('/hive.png')] opacity-[0.05] group-hover:scale-110 transition-transform duration-[10s]"></div>
                                            <div className="relative z-10 flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                    <CreditCard size={32} className="text-green" />
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
