"use client"
import { useState, useEffect } from "react"
import { useTranslation } from "./translation-provider"
import type { JSX } from "react/jsx-runtime" // Import JSX to fix the undeclared variable error

interface TranslatedTextProps {
  text: string
  className?: string
  as?: keyof JSX.IntrinsicElements
}

export default function TranslatedText({ text, className, as: Component = "span" }: TranslatedTextProps) {
  const { translate, currentLanguage } = useTranslation()
  const [translatedText, setTranslatedText] = useState(text)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const translateText = async () => {
      if (currentLanguage === "en") {
        setTranslatedText(text)
        return
      }

      setIsLoading(true)
      try {
        const result = await translate(text)
        setTranslatedText(result)
      } catch (error) {
        console.error("Translation failed:", error)
        setTranslatedText(text)
      } finally {
        setIsLoading(false)
      }
    }

    translateText()
  }, [text, translate, currentLanguage])

  return <Component className={className}>{isLoading ? text : translatedText}</Component>
}
