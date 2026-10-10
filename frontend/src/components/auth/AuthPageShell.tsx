import type { ReactNode } from 'react'
import { ArrowLeft, Check, Gauge, Network } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '../Logo'

interface AuthPageShellProps {
  children: ReactNode
  eyebrow?: string
  heading?: string
  description?: string
}

export default function AuthPageShell({
  children,
  eyebrow = 'FROM YARN TO THE WORLD',
  heading = 'Textile Manufacturing System',
  description = 'Digitally manage your entire textile production from raw material to delivery.',
}: AuthPageShellProps) {
  return (
    <div className="min-h-screen bg-[#f5f8fc] min-[900px]:grid min-[900px]:grid-cols-[minmax(0,1fr)_minmax(400px,520px)]">
      <section className="relative isolate flex min-h-[310px] flex-col justify-between overflow-hidden bg-[#103957] px-6 py-6 text-white sm:px-10 sm:py-8 min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-screen min-[900px]:min-h-[680px] min-[900px]:px-12 min-[900px]:py-10 xl:px-16">
        <img
          src="/images/hero-spinning-mill.jpg"
          alt="Textile spinning machinery in a modern manufacturing mill"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          loading="eager"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[#08223a]/55 via-[#08223a]/30 to-[#08223a]/90 lg:bg-gradient-to-r lg:from-[#08223a]/75 lg:via-[#08223a]/55 lg:to-[#08223a]/20" />

        <div className="flex items-center justify-between gap-4">
          <Link to="/" aria-label="Everest Textile Mills home">
            <Logo variant="light" showTagline={false} />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 sm:text-sm"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span className="hidden min-[1100px]:inline">Back to website</span>
            <span className="min-[1100px]:hidden">Home</span>
          </Link>
        </div>

        <div className="mt-10 max-w-2xl lg:mb-10 lg:mt-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-blue-100 sm:text-xs">{eyebrow}</p>
          <h2 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {heading}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-blue-50/90 sm:text-base lg:text-lg">
            {description}
          </p>
          <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium text-white/95">
            <span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4 text-emerald-300" aria-hidden />Simple</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" aria-hidden />Efficient</span>
            <span className="inline-flex items-center gap-2"><Network className="h-4 w-4 text-emerald-300" aria-hidden />Connected</span>
          </div>
          <p className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
            <span className="h-1 w-12 rounded-full bg-[#70b52b]" />
            From Yarn to the World
          </p>
        </div>
      </section>

      <main className="flex min-w-0 items-center justify-center px-4 py-8 sm:px-8 sm:py-10 min-[900px]:min-h-screen min-[900px]:px-9 min-[900px]:py-12">
        <div className="w-full max-w-[470px] rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_rgba(15,45,75,0.12)] sm:p-8 lg:p-9">
          <div className="mb-7 flex justify-center">
            <Logo showTagline={false} className="[&_svg]:h-9 [&_span>span:first-child]:text-xs [&_span>span:first-child]:sm:text-sm" />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
