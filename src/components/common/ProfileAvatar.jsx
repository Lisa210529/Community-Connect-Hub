import { Link } from 'react-router-dom';
import { getInitials } from '../../utils/validation';

const SIZE_CLASSES = {
  sm: 'h-8 w-8 min-w-[2rem] text-xs rounded-md',
  md: 'h-10 w-10 min-w-[2.5rem] text-sm rounded-lg',
  lg: 'h-24 w-24 min-w-[6rem] text-2xl rounded-xl',
};

export default function ProfileAvatar({
  user,
  size = 'md',
  className = '',
  linkToProfile = false,
}) {
  const photoURL = user?.photoURL ?? '';
  const initials = getInitials(user?.firstName, user?.lastName);
  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const name = user?.name || `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'User';

  const content = photoURL ? (
    <img
      src={photoURL}
      alt={`${name} profile`}
      className={`object-cover border border-border ${sizeClass} ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center font-semibold bg-primary/15 text-primary border border-primary/30 ${sizeClass} ${className}`}
      aria-hidden={!photoURL}
    >
      {initials}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link to="/profile" className="shrink-0 hover:opacity-90 transition-opacity" title="View profile">
        {content}
      </Link>
    );
  }

  return <div className="shrink-0">{content}</div>;
}
