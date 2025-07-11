import { useEffect, useState } from 'react';

const FadeIn = ({ children, duration = 1000, delay = 100 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <div
      className={`transition-opacity ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
};

export default FadeIn;