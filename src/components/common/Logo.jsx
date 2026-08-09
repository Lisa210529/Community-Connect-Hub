import logoImage from '../../assets/images/cch-logo.png';

export default function Logo({ size = 'md', className = '', align = 'center' }) {
  const sizes = {
    sm: 'h-14',
    md: 'h-28',
    lg: 'h-40',
  };

  const alignClass = align === 'left' ? 'justify-start' : 'justify-center';

  return (
    <div className={`flex w-full ${alignClass} ${className}`.trim()}>
      <img
        src={logoImage}
        alt="Community Connect Hub — Madang Provincial Government"
        className={`${sizes[size]} w-auto max-w-[220px] object-contain`}
      />
    </div>
  );
}
