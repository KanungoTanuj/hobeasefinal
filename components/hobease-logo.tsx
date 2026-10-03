import Link from "next/link"
import type { ComponentProps } from "react"

interface HobeaseLogoProps extends Omit<ComponentProps<typeof Link>, "href" | "children"> {
  href?: string
  className?: string
  textClassName?: string
}

export default function HobeaseLogo({ href = "/", className, textClassName }: HobeaseLogoProps) {
  return (
    <Link href={href} className={className} aria-label="Hobease home">
      <span className={textClassName ?? "text-2xl font-bold font-serif"}>
        <span className="text-[#FF6600]">Hob</span>
        <span className="text-[#00B9D9]">ease</span>
      </span>
    </Link>
  )
}
