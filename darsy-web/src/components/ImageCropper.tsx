"use client";

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface ImageCropperProps {
    image: string;
    onClose: () => void;
    onCropSave: (croppedImage: Blob) => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ image, onClose, onCropSave }) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const [isReady, setIsReady] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        console.log('Crop complete:', croppedAreaPixels);
        setCroppedAreaPixels(croppedAreaPixels);
        setIsReady(true);
    }, []);

    const createImage = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', (error) => {
                console.error('Image load error:', error);
                reject(error);
            });
            if (!url.startsWith('data:')) {
                image.setAttribute('crossOrigin', 'anonymous');
            }
            image.src = url;
        });

    const getCroppedImg = async (
        imageSrc: string,
        pixelCrop: Area,
        rotation = 0
    ): Promise<Blob | null> => {
        try {
            const image = await createImage(imageSrc);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) return null;

            const rotRad = (rotation * Math.PI) / 180;
            const { width: bWidth, height: bHeight } = {
                width: Math.abs(Math.cos(rotRad) * image.width) + Math.abs(Math.sin(rotRad) * image.height),
                height: Math.abs(Math.sin(rotRad) * image.width) + Math.abs(Math.cos(rotRad) * image.height),
            };

            canvas.width = bWidth;
            canvas.height = bHeight;

            ctx.translate(bWidth / 2, bHeight / 2);
            ctx.rotate(rotRad);
            ctx.translate(-image.width / 2, -image.height / 2);
            ctx.drawImage(image, 0, 0);

            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');

            if (!croppedCtx) return null;

            // Compress by capping max dimensions to 500px for profile pictures
            const MAX_DIMENSION = 500;
            let outWidth = pixelCrop.width;
            let outHeight = pixelCrop.height;

            if (outWidth > MAX_DIMENSION || outHeight > MAX_DIMENSION) {
                if (outWidth > outHeight) {
                    outHeight = Math.round((MAX_DIMENSION / outWidth) * outHeight);
                    outWidth = MAX_DIMENSION;
                } else {
                    outWidth = Math.round((MAX_DIMENSION / outHeight) * outWidth);
                    outHeight = MAX_DIMENSION;
                }
            }

            croppedCanvas.width = outWidth;
            croppedCanvas.height = outHeight;

            croppedCtx.drawImage(
                canvas,
                pixelCrop.x,
                pixelCrop.y,
                pixelCrop.width,
                pixelCrop.height,
                0,
                0,
                outWidth,
                outHeight
            );

            return new Promise((resolve, reject) => {
                croppedCanvas.toBlob((file) => {
                    if (file) resolve(file);
                    else reject(new Error('Canvas toBlob failed'));
                }, 'image/jpeg', 0.85); // Reduced quality for compression
            });
        } catch (e) {
            console.error('getCroppedImg error:', e);
            return null;
        }
    };

    const handleSave = async () => {
        if (!isReady || !croppedAreaPixels) {
            alert('المرجو تحريك الصورة قليلاً للبدء\nPlease move the image slightly to start.');
            return;
        }
        if (isSaving) return;

        setIsSaving(true);
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
            if (croppedImage) {
                onCropSave(croppedImage);
            } else {
                alert('فشل في قص الصورة. حاول مجدداً.\nFailed to crop image. Please try again.');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('وقع خطأ ما. المرجو المحاولة مرة أخرى.\nSomething went wrong. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-dark/95 backdrop-blur-md overflow-y-auto"
        >
            <div className="min-h-full flex items-center justify-center p-4 py-10">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-4xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
                >
                    {/* Left Column (Cropper & Header) */}
                    <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-100">
                        {/* Header */}
                        <div className="px-6 py-4 md:px-8 md:py-6 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-dark tracking-tight">قص وتأكيد الصورة</h3>
                                <p className="text-[10px] text-dark/40 font-bold uppercase tracking-wider">Cut & Confirm Picture</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gray-50 flex items-center justify-center text-dark/40 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Cropper Area - Constrained height */}
                        <div className="relative w-full h-[300px] md:h-[400px] md:flex-1 bg-black flex-shrink-0">
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={1 / 1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                                showGrid={true}
                            />
                        </div>
                    </div>

                    {/* Right Column (Controls & Actions) */}
                    <div className="w-full md:w-[320px] flex flex-col flex-shrink-0 bg-white md:min-h-[400px]">
                        {/* Controls Area (Scrollable if needed) */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-5">
                            {/* Zoom Control */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-dark/40">
                                    <span className="flex items-center gap-1.5"><ZoomIn size={12} /> التكبير / Zoom</span>
                                    <span>{Math.round(zoom * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-green/10 rounded-full appearance-none cursor-pointer accent-green"
                                />
                            </div>

                            {/* Rotation Control */}
                            <div className="space-y-3">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-dark/40">
                                    <span className="flex items-center gap-1.5"><RotateCcw size={12} /> التدوير / Rotation</span>
                                    <span>{rotation}°</span>
                                </div>
                                <input
                                    type="range"
                                    value={rotation}
                                    min={0}
                                    max={360}
                                    step={1}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                    className="w-full h-1.5 bg-green/10 rounded-full appearance-none cursor-pointer accent-green"
                                />
                            </div>
                        </div>

                        {/* Actions Pinned to Bottom */}
                        <div className="flex-shrink-0 p-5 md:p-6 border-t border-gray-100 bg-white flex flex-col gap-3 z-10 w-full mt-auto">
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-gray-50 text-dark/60 font-bold rounded-2xl hover:bg-gray-100 transition-all text-sm"
                            >
                                إلغاء / Cancel
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSave();
                                }}
                                disabled={isSaving}
                                className={`w-full py-4 bg-green text-white font-bold rounded-2xl shadow-xl shadow-green/20 hover:shadow-green/30 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm ${isSaving ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                {isSaving ? 'جاري الحفظ...' : 'قص وتأكيد'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ImageCropper;
