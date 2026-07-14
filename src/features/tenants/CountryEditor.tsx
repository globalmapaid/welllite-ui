import { X } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  COUNTRY_OPTIONS,
  countryLabel,
  resolveCountryInput,
} from '@/lib/countries'

/**
 * Chip editor for a tenant's operating countries. Accepts a bare alpha-2 code,
 * a "Name (CODE)" suggestion, or an exact country name. The list is display /
 * entry only — the server validates which codes are actually supported.
 *
 * @param invalidCodes  codes the server rejected, highlighted in red.
 */
export function CountryEditor({
  id,
  value,
  onChange,
  invalidCodes = [],
  disabled,
}: {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  invalidCodes?: string[]
  disabled?: boolean
}) {
  const [input, setInput] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const listId = useId()
  const bad = new Set(invalidCodes)

  const add = () => {
    const code = resolveCountryInput(input)
    if (!code) {
      if (input.trim()) setHint('Enter a 2-letter country code (e.g. ET).')
      return
    }
    if (value.includes(code)) {
      setHint(`${countryLabel(code)} is already added.`)
      setInput('')
      return
    }
    onChange([...value, code])
    setInput('')
    setHint(null)
  }

  const remove = (code: string) => onChange(value.filter((c) => c !== code))

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    } else if (e.key === 'Backspace' && !input && value.length) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <Badge
              key={code}
              variant={bad.has(code) ? 'destructive' : 'secondary'}
              className="gap-1 pr-1"
            >
              {countryLabel(code)}
              <button
                type="button"
                onClick={() => remove(code)}
                disabled={disabled}
                aria-label={`Remove ${countryLabel(code)}`}
                className="rounded-full p-0.5 hover:bg-black/10 disabled:opacity-50"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <Input
        id={id}
        value={input}
        list={listId}
        disabled={disabled}
        placeholder="Add a country — type a name or code, then Enter"
        onChange={(e) => {
          setInput(e.target.value)
          setHint(null)
        }}
        onKeyDown={onKeyDown}
        onBlur={add}
        aria-label="Add country"
      />
      <datalist id={listId}>
        {COUNTRY_OPTIONS.filter((c) => !value.includes(c)).map((c) => (
          <option key={c} value={countryLabel(c)} />
        ))}
      </datalist>
      {hint && <p className="text-xs text-destructive">{hint}</p>}
    </div>
  )
}
