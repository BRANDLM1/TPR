'use client';
import { Modal } from '@mantine/core';

interface MediaItem {
  id: string;
  order: number;
  type: 'IMAGE' | 'VIDEO';
  source: string;
  alt?: string;
  caption?: string;
}

interface StoryModalProps {
  isOpen: boolean;
  content: {
    title: string;
    content: string;
    mediaItems?: MediaItem[]; // Changed from single media to array
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
          top: '110px',
          left: '20px',
          transform: 'none',
          margin: 0,
          width: '400px',
          maxWidth: '90vw',
        };
      case 'TOP_RIGHT':
        return {
          position: 'fixed' as const,
          top: '110px',
          right: '20px',
          transform: 'none',
          margin: 0,
          width: '400px',
          maxWidth: '90vw',
        };
      case 'BOTTOM_LEFT':
        return {
          position: 'fixed' as const,
          bottom: '20px',
          left: '20px',
          transform: 'none',
          margin: 0,
          width: '400px',
          maxWidth: '90vw',
        };
      case 'BOTTOM_RIGHT':
        return {
          position: 'fixed' as const,
          bottom: '20px',
          right: '20px',
          transform: 'none',
          margin: 0,
          width: '400px',
          maxWidth: '90vw',
        };
      case 'CENTER':
      default:
        return {};
    }
  };

  // Sort media items by order and render them
  const sortedMediaItems = content.mediaItems? [...content.mediaItems].sort((a, b) => a.order - b.order): [];

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={content.title}
      size="md"
      centered={position === 'CENTER'}
      withOverlay = {false}
      styles={{
        title: { 
          fontSize: '1.5rem', 
          fontWeight: 'bold',
          fontFamily: 'var(--font-fell)' 
        },
        content: position !== 'CENTER' ? getPositionStyles() : {
          marginTop: position === 'CENTER' ? '80px' : '0px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          ...getPositionStyles()
        },
        body: {
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }
      }}
    >
      <div className="story-modal-content">
        {/* Media Items */}
        {sortedMediaItems.length > 0 && (
          <div className="mb-4 space-y-3">
            {sortedMediaItems.map((mediaItem) => (
              <div key={mediaItem.id} className="media-item">
                {mediaItem.type === 'IMAGE' ? (
                  <div>
                    <img 
                      src={mediaItem.source} 
                      alt={mediaItem.alt || content.title}
                      className="w-full max-h-60 object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        console.error('Failed to load image:', mediaItem.source);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {mediaItem.caption && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {mediaItem.caption}
                      </p>
                    )}
                  </div>
                ) : mediaItem.type === 'VIDEO' ? (
                  <div>
                    <video 
                      src={mediaItem.source}
                      controls
                      className="w-full rounded-lg shadow-md"
                      onError={(e) => {
                        console.error('Failed to load video:', mediaItem.source);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {mediaItem.caption && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        {mediaItem.caption}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Content Text */}
        <div className="mb-6">
          <p className="text-base leading-relaxed font-lato">
            {content.content}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {content.canGoBack && (
              <button
                onClick={onBack}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-lato text-sm"
              >
                Back
              </button>
            )}
          </div>
          
          <button
            onClick={onNext}
            className="bg-amber-300 text-black px-6 py-2 rounded-lg hover:bg-amber-400 transition-colors font-lato font-bold text-lg"
          >
            {content.nextButtonText || (content.isLastStep ? 'Explore' : 'Continue')}
          </button>
        </div>
      </div>
    </Modal>
  );
}