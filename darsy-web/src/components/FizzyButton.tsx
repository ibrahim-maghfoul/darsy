'use client';

import React, { useState, useEffect } from 'react';
import './FizzyButton.scss';
import { Check } from 'lucide-react';

interface FizzyButtonProps {
    href: string;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    id: string;
    disabled?: boolean;
    variant?: 'dark' | 'green';
    onClick?: (e: React.MouseEvent) => void;
}

const FizzyButton: React.FC<FizzyButtonProps> = ({ href, icon, title, subtitle, id, disabled, variant = 'dark', onClick }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return;

        if (onClick) {
            onClick(e);
            return;
        }

        if (!isChecked) {
            e.preventDefault();
            setIsChecked(true);
            // Simulate download start after animation
            setTimeout(() => {
                window.open(href, '_blank', 'noopener,noreferrer');
                // Reset after some time if needed, or keep checked
                // setTimeout(() => setIsChecked(false), 5000);
            }, 4500);
        }
    };

    return (
        <div className={`fizzy_container ${disabled ? 'disabled' : ''} ${variant}`}>
            <input
                type="checkbox"
                id={id}
                checked={isChecked}
                onChange={() => { }} // Controlled by click for better UX
                disabled={disabled}
            />
            <label htmlFor={id} onClick={handleClick}>
                <div className="button_inner">
                    <div className="content_wrapper">
                        <div className={`shrink-0 ${variant === 'green' ? 'text-white' : 'text-[#3aaa6a]'}`}>
                            {icon}
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest leading-none mb-1">
                                {subtitle}
                            </p>
                            <p className="text-lg font-bold leading-tight text-white">
                                {title}
                            </p>
                        </div>
                    </div>

                    <div className="tick">
                        <Check size={32} strokeWidth={3} />
                    </div>

                    <div className="b_l_quad">
                        {Array.from({ length: 52 }).map((_, i) => (
                            <div key={i} className="button_spots" />
                        ))}
                    </div>
                </div>
            </label>
        </div>
    );
};

export default FizzyButton;
