import React from 'react';
import md5 from 'md5';

interface SimpleAvatarProps {
  email: string;
  name?: string;
  size?: number;
}

const UserAvatar: React.FC<SimpleAvatarProps> = ({ email, name, size = 50 }) => {
  const generateColor = (email: string): string => {
    const hash = md5(email.trim().toLowerCase());
    return `#${hash.substring(0, 6)}`;
  };

  const getInitial = (): string => {
    if (name && name.trim()) {
      return name.trim().charAt(0).toUpperCase();
    }
    if (email && email.trim()) {
      return email.trim().charAt(0).toUpperCase();
    }
    return '?';
  };

  const getTextColor = (hexColor: string): string => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  const backgroundColor = generateColor(email);
  const textColor = getTextColor(backgroundColor);
  const initial = getInitial();

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: backgroundColor,
        borderRadius: '5%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${size / 2}px`,
        fontWeight: 'bold',
        color: textColor,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
};

export default UserAvatar;
