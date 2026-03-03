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
    const [citySearch, setCitySearch] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        displayName: user?.displayName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        age: user?.age || "",
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
            if (!target.closest(".city-dropdown-container")) {
                setShowCityDropdown(false);
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

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/user/profile');
            logout();
            showSnackbar("Account deleted successfully", "success");
        } catch (error) {
            showSnackbar(tp("delete_error"), "error");
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
                    <p className="text-lg text-muted-foreground">{t("desc")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Nav */}
                    <div className="md:col-span-1 space-y-2">
                        {[
                            { id: "profile", label: t("personal_info"), icon: User },
                            { id: "security", label: t("security"), icon: Shield },
                            { id: "billing", label: t("billing"), icon: CreditCard },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold transition-all text-left ${activeTab === item.id
                                    ? "bg-green text-white shadow-lg shadow-green/20"
                                    : "hover:bg-green/5 text-dark/60 hover:text-green"
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    {/* Settings Content */}
                    <div className="md:col-span-3 space-y-12 pb-20">
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
                                                }}
                                                onFocus={() => setShowCityDropdown(true)}
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
                                                    className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-green/10 rounded-[32px] shadow-2xl shadow-green/10 overflow-hidden max-h-64 overflow-y-auto glass-effect p-2"
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

                                {/* Danger Zone */}
                                <section className="space-y-6 pt-12 border-t border-gray-100">
                                    <h2 className="text-2xl font-bold text-red-500 border-b border-red-100 pb-4">{t("delete_account")}</h2>
                                    <div className="p-8 rounded-[32px] border border-red-100 bg-red-50/50 space-y-6">
                                        <div>
                                            <h3 className="font-bold text-dark mb-1">{t("delete_account")}</h3>
                                            <p className="text-sm text-muted-foreground">{t("delete_account_desc")}</p>
                                        </div>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="px-8 py-4 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                        >
                                            {t("delete_account_btn")}
                                        </button>
                                    </div>
                                </section>
                            </section>
                        )}

                        <AnimatePresence>
                            {showDeleteModal && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setShowDeleteModal(false)}
                                        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        className="relative w-full max-w-md bg-white rounded-[40px] p-10 shadow-3xl text-center space-y-8"
                                    >
                                        <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto text-red-500">
                                            <Shield size={40} />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-2xl font-bold text-dark">{t("modal_delete_title")}</h3>
                                            <p className="text-muted-foreground">
                                                {tp("delete_confirm_alert")}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={handleDeleteAccount}
                                                className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                            >
                                                {t("confirm_delete")}
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteModal(false)}
                                                className="w-full py-4 bg-gray-50 text-dark/60 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                                            >
                                                {t("cancel")}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

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

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {pricingPlans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className={`relative p-8 rounded-[40px] border transition-all ${plan.recommended ? "border-green shadow-2xl shadow-green/10 bg-white" : "border-green/10 bg-green/5"
                                                } ${user?.subscription?.plan === plan.id ? "ring-4 ring-green/20" : ""}`}
                                        >
                                            {plan.recommended && (
                                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green text-white text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-lg shadow-green/20">
                                                    Recommended
                                                </div>
                                            )}

                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-dark">{plan.name}</h3>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black text-dark">
                                                            {plan.id === "free" ? "0" : (billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice)}
                                                        </span>
                                                        <span className="text-lg font-bold text-muted-foreground">DH</span>
                                                        <span className="text-sm font-bold text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                                                    </div>
                                                </div>

                                                <ul className="space-y-4">
                                                    {plan.features.map((feature, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-dark/70">
                                                            <div className="w-5 h-5 rounded-full bg-green/10 flex items-center justify-center shrink-0 mt-0.5">
                                                                <Plus size={12} className="text-green" />
                                                            </div>
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>

                                                <button
                                                    onClick={() => handleSubscribe(plan.id)}
                                                    disabled={isSubscribing !== null || user?.subscription?.plan === plan.id}
                                                    className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${user?.subscription?.plan === plan.id
                                                        ? "bg-green/10 text-green cursor-default"
                                                        : plan.id === "free"
                                                            ? "bg-white border border-green/20 text-dark hover:border-green"
                                                            : "bg-green text-white hover:bg-green/90 shadow-lg shadow-green/20"
                                                        }`}
                                                >
                                                    {isSubscribing === plan.id ? <Loader2 size={20} className="animate-spin" /> : (user?.subscription?.plan === plan.id ? "Active Plan" : "Choose Plan")}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
