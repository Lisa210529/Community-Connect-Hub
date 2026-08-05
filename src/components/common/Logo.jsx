export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div className={`font-bold ${sizes[size]}`}>
      <span className="text-cyber-text">Community </span>
      <span className="text-cyber-accent">Connect Hub</span>
    </div>
  );
}
