'use client';

import { createPortal } from 'react-dom';
import type { Dispatch, SetStateAction } from 'react';
import type { ReviewFormState } from '../types';

interface ReviewFormModalProps {
    show: boolean;
    isSubmittingReview: boolean;
    reviewForm: ReviewFormState;
    setReviewForm: Dispatch<SetStateAction<ReviewFormState>>;
    onClose: () => void;
    onSubmit: () => void;
}

export default function ReviewFormModal({
    show,
    isSubmittingReview,
    reviewForm,
    setReviewForm,
    onClose,
    onSubmit,
}: ReviewFormModalProps) {
    if (!show) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] overflow-hidden opacity-100 visible transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]">
            <button
                type="button"
                aria-label="Close review modal"
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    if (isSubmittingReview) return;
                    onClose();
                }}
            />
            <div
                className="relative h-full overflow-y-auto overscroll-contain touch-pan-y x-rail"
                onWheel={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                data-lenis-prevent="true"
            >
                <div className="min-h-full flex items-start md:items-center justify-center pb-12 sm:px-4 md:py-6">
                    <div className="relative w-full max-w-2xl bg-surface sm:rounded-xl p-8 md:p-12 shadow-2xl transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform translate-y-0 scale-100 opacity-100">
                        <div className="flex items-start justify-between gap-4 mb-8">
                            <div>
                                <h3 className="font-headline text-3xl md:text-4xl text-primary font-medium">Write a Review</h3>
                                <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mt-2">Share your experience with Gram Ansh</p>
                            </div>
                            <button
                                type="button"
                                className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50"
                                onClick={onClose}
                                disabled={isSubmittingReview}
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <div className="flex flex-col gap-8">
                            <div className="flex flex-col gap-2">
                                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Full Name</label>
                                <input
                                    value={reviewForm.author}
                                    onChange={(e) => setReviewForm((p) => ({ ...p, author: e.target.value }))}
                                    className="bg-surface border border-outline px-6 py-4 rounded-lg font-body text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    placeholder="Enter your name"
                                />
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Rating</label>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} type="button" onClick={() => setReviewForm((p) => ({ ...p, rating: star }))}
                                            className={`material-symbols-outlined text-3xl transition-colors hover:scale-110 ${star <= reviewForm.rating ? 'text-secondary' : 'text-outline-variant'}`}
                                            style={{ fontVariationSettings: star <= reviewForm.rating ? "'FILL' 1" : "'FILL' 0" }}>grade</button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Your Experience</label>
                                <textarea
                                    value={reviewForm.text}
                                    onChange={(e) => setReviewForm((p) => ({ ...p, text: e.target.value }))}
                                    rows={5}
                                    className="bg-surface border border-outline px-6 py-4 rounded-lg font-body text-base leading-relaxed focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none break-words whitespace-pre-wrap"
                                    placeholder="Tell us what you liked..."
                                />
                            </div>

                            <button
                                onClick={onSubmit}
                                disabled={isSubmittingReview || !reviewForm.author.trim() || !reviewForm.text.trim()}
                                className="w-full sm:w-auto mt-4 self-end bg-primary text-on-primary px-10 py-4 rounded-full font-label text-sm uppercase tracking-widest font-bold hover:shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:hover:text-on-primary disabled:hover:shadow-none"
                            >
                                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
