import logoImage from '../../assets/images/cch-logo.png';

export default function Logo({ size = 'md', className = '', align = 'center' }) {
  const sizes = {
    sm: 'h-14 w-14',
    md: 'h-28 w-28',
    lg: 'h-44 w-44',
  };

  const alignClass = align === 'left' ? 'justify-start' : 'justify-center';

  return (
    <div className={`flex w-full ${alignClass} ${className}`.trim()}>
      <img
        src={logoImage}
        alt="Community Connect Hub — Madang Provincial Government"
        className={`${sizes[size]} shrink-0 rounded-full object-cover object-center`}
      />
    </div>
  );
}
