export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#04040a] relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,1) 1px,transparent 1px)',
          backgroundSize: '80px 80px'
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(0,212,255,0.04),transparent)]" />
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#00d4ff] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" stroke="#04040a" strokeWidth="1.6" strokeLinecap="round" width={16} height={16}>
                <path d="M2 13 L8 3 L14 13 M5 9.5 L11 9.5"/>
              </svg>
            </div>
            <span className="font-display text-xl font-extrabold tracking-tighter">AIMO</span>
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}
