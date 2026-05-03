'use client';
import { Modal } from '@mantine/core';

export type MediaItem = {
  id: string;
  order: number;
  type: 'IMAGE' | 'VIDEO';
  source: string;
  alt?: string | null;
  caption?: string | null;
};

export type ModalPosition =
  | 'CENTER'
  | 'TOP_LEFT'
  | 'TOP_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_RIGHT';

interface StoryModalProps {
  isOpen: boolean;
  content: {
    title: string;
    content: string;
    mediaItems?: MediaItem[];
    nextButtonText?: string;
    canGoBack: boolean;
    isLastStep: boolean;
  } | null;
  position?: ModalPosition;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

// Corner positions sit below the fixed Nav (~90px tall) so they don't collide.
// Width is fixed so the modal doesn't expand to the full content width.
const POSITION_STYLES: Record<Exclude<ModalPosition, 'CENTER'>, React.CSSProperties> = {
  TOP_LEFT:     { position: 'fixed', top: 110,    left: 20,  transform: 'none', margin: 0, width: 400, maxWidth: '90vw' },
  TOP_RIGHT:    { position: 'fixed', top: 110,    right: 20, transform: 'none', margin: 0, width: 400, maxWidth: '90vw' },
  BOTTOM_LEFT:  { position: 'fixed', bottom: 20,  left: 20,  transform: 'none', margin: 0, width: 400, maxWidth: '90vw' },
  BOTTOM_RIGHT: { position: 'fixed', bottom: 20,  right: 20, transform: 'none', margin: 0, width: 400, maxWidth: '90vw' },
};

export default function StoryModal({
  isOpen,
  content,
  position = 'CENTER',
  onNext,
  onBack,
  onClose,
}: StoryModalProps) {
  if (!content) return null;

  const contentStyle = position === 'CENTER' ? {} : POSITION_STYLES[position];

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={content.title}
      size="lg"
      centered={position === 'CENTER'}
      withOverlay={position === 'CENTER'}
      // Lock the user into the story sequence: no X button, no Esc,
      // no click-outside dismiss. The only ways out are Next/Back
      // through the steps, the final-step "Explore" button (which
      // hands them the map), or picking a different story from the
      // dropdown (which resets state).
      withCloseButton={false}
      closeOnEscape={false}
      closeOnClickOutside={false}
      styles={{
        title: {
          fontSize: '2rem',
          fontWeight: 'bold',
          fontFamily: 'var(--font-fell)',
          color: 'black',
        },
        content: contentStyle,
      }}
    >
      <div className="story-modal-content">
        {content.mediaItems?.map((media) => (
          <figure key={media.id} className="mb-6">
            {media.type === 'IMAGE' ? (
              <img
                src={media.source}
                alt={media.alt ?? content.title}
                className="w-full rounded-lg shadow-md"
                onError={(e) => {
                  console.warn('Failed to load image:', media.source);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <video
                src={media.source}
                controls
                className="w-full rounded-lg shadow-md"
                onError={(e) => {
                  console.warn('Failed to load video:', media.source);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {media.caption && (
              <figcaption className="mt-2 text-sm text-black font-lato">
                {media.caption}
              </figcaption>
            )}
          </figure>
        ))}

        <div className="mb-8 text-black">
          <p className="text-lg leading-relaxed font-lato">{content.content}</p>
        </div>

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
