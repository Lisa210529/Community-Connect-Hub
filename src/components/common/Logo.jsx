import logoImage from '../../assets/images/cch-logo.png';

const SIZE_CLASSES = {
  sm: 'h-14 w-14',
  md: 'h-28 w-28',
  lg: 'h-44 w-44',
  sidebar: 'h-28 w-28',
};

export default function Logo({ size = 'md', className = '', align = 'center' }) {
  const boxClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const alignClass = align === 'left' ? 'justify-start' : 'justify-center';

  return (
    <div className={`flex w-full ${alignClass} ${className}`.trim()}>
      <div
        className={`${boxClass} aspect-square shrink-0 overflow-hidden rounded-full`}
        aria-hidden="true"
      >
        <img
          src={logoImage}
          alt="Community Connect Hub — Madang Provincial Government"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}
