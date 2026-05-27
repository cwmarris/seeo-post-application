import React from 'react';
import { ThumbsUp, MessageSquare, Repeat2, Send, Globe } from 'lucide-react';
import { FOUNDER_PROFILES } from '../utils/mockData';

interface LinkedInPreviewProps {
  authorId: string;
  content: string;
  image?: string;
  timestamp?: string;
}

export const LinkedInPreview: React.FC<LinkedInPreviewProps> = ({
  authorId,
  content,
  image,
  timestamp = 'Just now'
}) => {
  const profile = FOUNDER_PROFILES.find((p) => p.id === authorId) || FOUNDER_PROFILES[0];

  // Helper to format timestamps nicely
  const formatTime = (timeStr: string) => {
    if (timeStr === 'Just now') return 'Just now';
    try {
      const date = new Date(timeStr);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' • ';
    } catch (e) {
      return 'Scheduled • ';
    }
  };

  return (
    <div className="linkedin-preview-card">
      {/* LinkedIn Header */}
      <div className="linkedin-header">
        <div className="linkedin-author-info">
          <img src={profile.avatar} alt={profile.name} className="linkedin-avatar" />
          <div className="linkedin-author-text">
            <div className="linkedin-author-name">
              {profile.name}
              <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)', fontWeight: 400 }}>• 1st</span>
            </div>
            <div className="linkedin-author-role">{profile.role}</div>
            <div className="linkedin-timestamp">
              {formatTime(timestamp)}
              <Globe size={12} style={{ marginLeft: '2px' }} />
            </div>
          </div>
        </div>
        <button className="linkedin-follow-btn">
          <span style={{ fontSize: '18px', fontWeight: 400 }}>+</span> Follow
        </button>
      </div>

      {/* LinkedIn Text Content */}
      <div className="linkedin-content">
        {content}
      </div>

      {/* Image Attachment if generated */}
      {image && (
        <div className="linkedin-image-attachment">
          <img src={image} alt="LinkedIn Post Visual" />
        </div>
      )}

      {/* Social Reactions Summary */}
      <div className="linkedin-social-bar">
        <div className="linkedin-reactions">
          <span className="react-icon-holder" style={{ zIndex: 3 }}>
            <span style={{ background: '#0a66c2', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ThumbsUp size={10} color="white" />
            </span>
          </span>
          <span className="react-icon-holder" style={{ marginLeft: '-4px', zIndex: 2 }}>
            <span style={{ background: '#70b5f9', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
              💡
            </span>
          </span>
          <span className="react-icon-holder" style={{ marginLeft: '-4px', zIndex: 1 }}>
            <span style={{ background: '#78e08f', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}>
              👏
            </span>
          </span>
          <span style={{ marginLeft: '4px', fontWeight: 500 }}>Craig Marris and 142 others</span>
        </div>
        <div>
          <span>24 comments • 11 shares</span>
        </div>
      </div>

      {/* Interactive Action Bar */}
      <div className="linkedin-action-bar">
        <button className="linkedin-action-btn">
          <ThumbsUp size={18} />
          <span>Like</span>
        </button>
        <button className="linkedin-action-btn">
          <MessageSquare size={18} />
          <span>Comment</span>
        </button>
        <button className="linkedin-action-btn">
          <Repeat2 size={18} />
          <span>Repost</span>
        </button>
        <button className="linkedin-action-btn">
          <Send size={18} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
