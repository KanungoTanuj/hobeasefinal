"use client"
import { useTranslation } from "./translation-provider"
import { translateText } from "@/lib/translations"
import type { JSX } from "react/jsx-runtime"

interface TranslatedTextProps {
  text: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export default function TranslatedText({ text, className, as: Component = "span" }: TranslatedTextProps) {
  const { currentLanguage } = useTranslation()
  const translatedText = translateText(text, currentLanguage)

  return <Component className={className}>{translatedText}</Component>
}
