export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl shadow-lift md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between bg-gradient-to-br from-accent to-[#5e5ce6] p-10 text-white md:flex">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/20 text-lg">◆</span>
            <span className="text-lg font-semibold tracking-tight">Collab</span>
          </div>
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Where teams plan,
              <br /> build, and talk.
            </h1>
            <p className="mt-4 max-w-sm text-white/80">
              Workspaces, projects, tasks and real-time chat — beautifully in one place.
            </p>
          </div>
          <p className="text-sm text-white/60">Designed for focus.</p>
        </div>

        {/* Form panel */}
        <div className="flex flex-col justify-center bg-surface/90 p-8 backdrop-blur-xl sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mb-6 mt-1 text-sm text-haze">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
