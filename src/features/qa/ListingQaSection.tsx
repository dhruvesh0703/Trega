import React, { useState } from 'react';
import {
 HelpCircle,
 MessageCircle,
 Send,
 CheckCircle2,
 Clock,
 ThumbsUp,
 ShieldCheck,
 Reply,
} from 'lucide-react';
import { Listing, ListingQuestion } from '../../types';
import { useMarketplace } from '../../core/context/MarketplaceContext';
import { TrustBadge } from '../kyc/TrustBadge';

interface ListingQaSectionProps {
 listing: Listing;
}

export const ListingQaSection: React.FC<ListingQaSectionProps> = ({ listing }) => {
 const {
 flags,
 currentUser,
 listingQuestions,
 askListingQuestion,
 answerListingQuestion,
 upvoteListingQuestion,
 setActiveModal,
 showToast,
 } = useMarketplace();

 const [questionText, setQuestionText] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [replyingToId, setReplyingToId] = useState<string | null>(null);
 const [replyText, setReplyText] = useState('');
 const [isSubmittingReply, setIsSubmittingReply] = useState(false);

 const questions: ListingQuestion[] = listingQuestions[listing.id] || [];

 const isSeller = currentUser ? currentUser.id === listing.seller.id : false;

 const quickQuestions = [
 'Is original bill or invoice available?',
 `Is delivery available to my address in ${listing.locationArea}?`,
 'Are there any functional defects or hidden issues?',
 'Are all original box accessories included?',
 'Is the price negotiable for quick delivery?',
 ];

 const handleAskQuestion = async (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!questionText.trim()) return;

 if (!currentUser) {
 showToast('Please sign in to ask a public question to the seller.');
 setActiveModal('AUTH');
 return;
 }

 setIsSubmitting(true);
 try {
 await askListingQuestion(listing.id, questionText);
 setQuestionText('');
 } catch (err: any) {
 // toast shown in context
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleQuickQuestionClick = (prompt: string) => {
 setQuestionText(prompt);
 };

 const handlePostAnswer = async (questionId: string) => {
 if (!replyText.trim()) return;

 if (!currentUser) {
 showToast('Please sign in to post an answer.');
 setActiveModal('AUTH');
 return;
 }

 setIsSubmittingReply(true);
 try {
 await answerListingQuestion(listing.id, questionId, replyText);
 setReplyText('');
 setReplyingToId(null);
 } catch (err: any) {
 // toast shown in context
 } finally {
 setIsSubmittingReply(false);
 }
 };

 if (!flags.isQaEnabled) {
 return null;
 }

 return (
 <div id="listing-qa-section" className="border-t border-stone-200 pt-6 mt-6 space-y-6">
 {/* Section Header */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-xs">
 <HelpCircle className="w-4 h-4" />
 </div>
 <div>
 <h3 className="text-base font-extrabold text-stone-900 font-display flex items-center gap-2">
 Public Questions & Answers
 <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-transparent border border-brand-300 text-brand-700 border border-brand-200">
 {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
 </span>
 </h3>
 <p className="text-xs text-stone-500 mt-0.5">
 Publicly visible on this listing to help all buyers
 </p>
 </div>
 </div>

 <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 bg-stone-100 px-3 py-1 rounded-full border border-stone-200 self-start sm:self-auto">
 <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />
 <span>Verified Seller Replies</span>
 </div>
 </div>

 {/* Ask a Question Input Box */}
 {isSeller ? null : (
 <div className="bg-stone-50 rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3">
 <div className="flex items-center justify-between">
 <label htmlFor="ask-question-input" className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
 <MessageCircle className="w-3.5 h-3.5 text-brand-600" />
 <span>Ask {listing.seller.name} a Public Question</span>
 </label>
 <span className="text-[10px] text-stone-400 font-medium">Public for all to read</span>
 </div>

 {/* Quick Suggestion Pills */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
 <span className="text-[10px] font-bold uppercase text-stone-400 shrink-0 mr-1">Quick:</span>
 {quickQuestions.map((q, idx) => (
 <button
 key={idx}
 type="button"
 onClick={() => handleQuickQuestionClick(q)}
 className="px-2.5 py-1 bg-white hover:bg-brand-50 text-stone-700 hover:text-brand-900 rounded-lg border border-stone-200 hover:border-brand-300 transition-colors whitespace-nowrap shrink-0 text-[11px] font-medium cursor-pointer"
 >
 {q}
 </button>
 ))}
 </div>

 <form onSubmit={handleAskQuestion} className="space-y-2.5">
 <div className="relative">
 <textarea
 id="ask-question-input"
 value={questionText}
 onChange={(e) => setQuestionText(e.target.value)}
 placeholder={`e.g. Is delivery available to my address in ${listing.locationArea}? Does this include original bills or accessories?`}
 rows={2}
 maxLength={600}
 className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition-all shadow-2xs"
 />
 </div>
 <div className="flex items-center justify-between pt-1">
 <p className="text-[11px] text-stone-500 flex items-center gap-1">
 <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
 <span>Answers are published here for all buyers to read.</span>
 </p>
 <button
 type="submit"
 disabled={isSubmitting || !questionText.trim()}
 className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-brand-600/20"
 >
 <Send className="w-3.5 h-3.5" />
 <span>{isSubmitting ? 'Posting...' : 'Post Question'}</span>
 </button>
 </div>
 </form>
 </div>
 )}

 {/* Questions & Answers Thread List */}
 <div className="space-y-4">
 {questions.length === 0 ? (
 <div className="bg-white rounded-2xl p-6 border border-stone-200 text-center space-y-2">
 <div className="w-10 h-10 rounded-full bg-transparent border border-brand-300 text-brand-600 flex items-center justify-center mx-auto">
 <HelpCircle className="w-5 h-5" />
 </div>
 <h4 className="text-sm font-bold text-stone-800">No questions asked yet on this listing</h4>
 <p className="text-xs text-stone-500 max-w-md mx-auto">
 Have a doubt about item condition, delivery, or accessories? Be the first to ask the seller a public question above.
 </p>
 </div>
 ) : (
 questions.map((q) => {
 const hasAnswer = !!q.answer && q.answer.answerText.trim().length > 0;
 const canAnswer = currentUser && currentUser.id === listing.seller.id;

 return (
 <div
 key={q.id}
 id={`qa-item-${q.id}`}
 className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 space-y-3.5 shadow-2xs"
 >
 {/* Question Row */}
 <div className="space-y-2">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <img
 src={q.askedBy.avatar}
 alt={q.askedBy.name}
 className="w-7 h-7 rounded-full object-cover border border-stone-200"
 />
 <div>
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-xs font-bold text-stone-900">{q.askedBy.name}</span>
 <TrustBadge
 isVerified={q.askedBy.isKycVerified}
 
 collegeOrArea={q.askedBy.collegeOrArea}
 compact
 />
 </div>
 <span className="text-[10px] text-stone-400 flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {q.createdAt} • {q.askedBy.collegeOrArea}
 </span>
 </div>
 </div>

 {/* Upvote Button */}
 <button
 type="button"
 onClick={() => upvoteListingQuestion(listing.id, q.id)}
 className="px-2 py-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-[11px] font-semibold text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
 title="Helpful question"
 >
 <ThumbsUp className="w-3 h-3 text-stone-500" />
 <span>{q.upvotesCount || 0}</span>
 </button>
 </div>

 {/* Question Text */}
 <div className="flex items-start gap-2 pt-0.5">
 <span className="text-[11px] font-black uppercase text-brand-700 bg-transparent border border-brand-300 px-1.5 py-0.5 rounded-md shrink-0">
 Q
 </span>
 <p className="text-xs sm:text-sm font-semibold text-stone-900 leading-relaxed">
 {q.question}
 </p>
 </div>
 </div>

 {/* Seller Answer Box or Awaiting Status */}
 {hasAnswer ? (
 <div className="ml-2 sm:ml-4 pl-3.5 sm:pl-4 border-l-2 border-brand-400 bg-brand-50 rounded-r-xl p-3.5 space-y-2">
 <div className="flex items-center justify-between gap-2">
 <div className="flex items-center gap-2">
 <img
 src={q.answer!.answeredBy.avatar || listing.seller.avatar}
 alt={q.answer!.answeredBy.name}
 className="w-6 h-6 rounded-full object-cover border border-brand-200"
 />
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-xs font-bold text-brand-950">
 {q.answer!.answeredBy.name}
 </span>
 <span className="text-[10px] font-extrabold uppercase bg-brand-600 text-white px-1.5 py-0.5 rounded-md shadow-2xs">
 Seller
 </span>
 <TrustBadge
 isVerified={q.answer!.answeredBy.isKycVerified || listing.seller.isKycVerified}
 
 collegeOrArea={q.answer!.answeredBy.collegeOrArea || listing.seller.collegeOrArea}
 compact
 />
 </div>
 </div>
 <span className="text-[10px] text-stone-400 font-medium shrink-0">
 {q.answer!.answeredAt}
 </span>
 </div>

 <div className="flex items-start gap-2">
 <span className="text-[11px] font-black uppercase text-brand-800 bg-brand-100 border border-brand-300 px-1.5 py-0.5 rounded-md shrink-0">
 A
 </span>
 <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-normal">
 {q.answer!.answerText}
 </p>
 </div>
 </div>
 ) : (
 <div className="ml-2 sm:ml-4 pl-3.5 sm:pl-4 border-l-2 border-amber-300 bg-amber-50 rounded-r-xl p-3 space-y-2">
 <div className="flex items-center justify-between gap-2">
 <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5 text-amber-600" />
 <span>Awaiting seller answer</span>
 </span>

 {canAnswer && replyingToId !== q.id && (
 <button
 type="button"
 onClick={() => {
 setReplyingToId(q.id);
 setReplyText('');
 }}
 className="px-3 py-1 bg-transparent border border-brand-600 text-brand-700 hover:bg-brand-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
 >
 <Reply className="w-3 h-3" />
 <span>Answer as Seller</span>
 </button>
 )}
 </div>

 {/* Inline Reply Form for Seller */}
 {canAnswer && replyingToId === q.id && (
 <div className="pt-2 space-y-2">
 <textarea
 value={replyText}
 onChange={(e) => setReplyText(e.target.value)}
 placeholder={`Write official public answer to ${q.askedBy.name}...`}
 rows={2}
 maxLength={600}
 className="w-full px-3 py-2 bg-white border border-brand-300 rounded-xl text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none shadow-2xs"
 />
 <div className="flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setReplyingToId(null)}
 className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-800 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
 >
 Cancel
 </button>
 <button
 type="button"
 disabled={isSubmittingReply || !replyText.trim()}
 onClick={() => handlePostAnswer(q.id)}
 className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
 >
 <Send className="w-3 h-3" />
 <span>{isSubmittingReply ? 'Publishing...' : 'Publish Answer'}</span>
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
 })
 )}
 </div>
 </div>
 );
};
