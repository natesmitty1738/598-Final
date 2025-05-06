import React from 'react';

interface ContentWrapperProps {
  children: React.ReactNode;
  className?: string;
  type?: 'header' | 'content' | 'global';
}

// creates a constrained-width container while allowing parent elements to have full-width borders
const ContentWrapper: React.FC<ContentWrapperProps> = ({ 
  children, 
  className = '',
  type = 'content' 
}) => {
  if (type === 'global') {
    return <div className={`w-full px-6 ${className}`}>{children}</div>;
  }
  
  return (
    <div className={`content-wrapper ${className}`}>
      {children}
    </div>
  );
};

export default ContentWrapper; 