'use client';

import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
    {
        name: 'سارة أحمد',
        role: 'طالبة — الثانوية العامة',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        content: 'منصة 9eray غيّرت طريقة دراستي تمامًا. المحتوى منظّم بشكل رائع وأجد كل ما أحتاجه في مكان واحد.',
    },
    {
        name: 'يوسف المنصور',
        role: 'طالب جامعي',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        content: 'الدروس واضحة ومفصّلة، وتحسّنت نتائجي بشكل ملحوظ منذ أن بدأت استخدام المنصة.',
    },
    {
        name: 'أستاذة فاطمة',
        role: 'مدرّسة — المرحلة الإعدادية',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        content: 'أنصح طلابي دائمًا باستخدام 9eray كمرجع داعم. يساعدهم على مراجعة الدروس بأسلوب تفاعلي وشيّق.',
    },
];

export default function Testimonials() {
    return (
        <section className="py-24 relative"
            style={{ background: "linear-gradient(180deg, #09090b 0%, #0f0b24 50%, #09090b 100%)" }}>
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 60% 40% at 50% 100%, rgba(109,40,217,0.12), transparent)" }} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-14"
                >
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">آراء المستخدمين</p>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">ماذا يقول طلابنا؟</h2>
                    <p className="text-zinc-400 max-w-xl mx-auto text-sm">
                        انضم إلى آلاف الطلاب الذين يتعلمون بذكاء مع 9eray.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className="rounded-2xl p-6 relative"
                            style={{
                                background: "rgba(139,92,246,0.07)",
                                border: "1px solid rgba(139,92,246,0.18)",
                                backdropFilter: "blur(12px)",
                            }}
                        >
                            {/* Quote mark */}
                            <div className="absolute top-4 right-5 text-4xl font-serif text-violet-700/40 select-none">"</div>

                            <div className="flex items-center gap-4 mb-4">
                                <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/40"
                                />
                                <div>
                                    <h4 className="text-sm font-bold text-white">{testimonial.name}</h4>
                                    <p className="text-xs text-violet-300">{testimonial.role}</p>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-300 leading-relaxed">{testimonial.content}</p>

                            {/* Star rating */}
                            <div className="mt-4 flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} style={{ color: "#a78bfa" }}>★</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
