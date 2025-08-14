'use client';
import { Modal } from '@mantine/core';

interface StoryModalProps {
  isOpen: boolean;
  content: {
    title: string;
    content: string;
    media?: {
      type: 'image' | 'video';
      src: string;
      alt?: string;
      poster?: string;
    };
    nextButtonText?: string;
    canGoBack: boolean;
    isLastStep: boolean;
  } | null;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;

  position?: 'CENTER' | 'TOP_LEFT' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';

}

export default function StoryModal({ 
  isOpen, 
  content, 
  onNext, 
  onBack, 
  onClose,
  position = 'CENTER'
}: StoryModalProps) {
  if (!content) return null;

  const getPositionStyles = () => {
    switch (position) {
      case 'TOP_LEFT':
        return {
          position: 'fixed' as const,
          top: '20px',
          left: '20px',
          transform: 'none',
          margin: 0
        };
      case 'TOP_RIGHT':
        return {
          position: 'fixed' as const,
          top: '20px',
          right: '20px',
          transform: 'none',
          margin: 0
        };
      case 'BOTTOM_LEFT':
        return {
          position: 'fixed' as const,
          bottom: '20px',
          left: '20px',
          transform: 'none',
          margin: 0
        };
      case 'BOTTOM_RIGHT':
        return {
          position: 'fixed' as const,
          bottom: '20px',
          right: '20px',
          transform: 'none',
          margin: 0
        };
      case 'CENTER':
      default:
        return {};
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={content.title}
      size="lg"
      centered
      styles={{
        title: { 
          fontSize: '2rem', 
          fontWeight: 'bold',
          fontFamily: 'var(--font-fell)' 
        },
        content: position !== 'CENTER' ? getPositionStyles() : {}
      }}
    >
      <div className="story-modal-content">
        {/* Media */}
        {content.media && (
          <div className="mb-6">
            {content.media.type === 'image' ? (
              <img 
                src={content.media.src} 
                alt={content.media.alt || content.title}
                className="w-full rounded-lg shadow-md"
              />
            ) : (
              <video 
                src={content.media.src}
                poster={content.media.poster}
                controls
                className="w-full rounded-lg shadow-md"
              />
            )}
          </div>
        )}

        {/* Content Text */}
        <div className="mb-8">
          <p className="text-lg leading-relaxed font-lato">
            {content.content}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {content.canGoBack && (
              <button
                onClick={onBack}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors font-lato"
              >
                Back
              </button>
            )}
          </div>
          
          <button
            onClick={onNext}
            className="bg-amber-300 text-black px-8 py-3 rounded-lg hover:bg-amber-400 transition-colors font-lato font-bold text-lg"
          >
            {content.nextButtonText || (content.isLastStep ? 'Explore' : 'Continue')}
          </button>
        </div>
      </div>
    </Modal>
  );
}