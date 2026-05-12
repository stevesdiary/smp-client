import { useEffect, useRef } from 'react'
import type { FieldValues, UseFormReset, UseFormWatch } from 'react-hook-form'

interface UseSyncedFormSectionParams<TForm extends FieldValues, TPayload> {
  formValue: TForm
  watch: UseFormWatch<TForm>
  reset: UseFormReset<TForm>
  toPayload: (value: TForm) => TPayload
  onChange: (payload: TPayload) => void
}

export function useSyncedFormSection<TForm extends FieldValues, TPayload>({
  formValue,
  watch,
  reset,
  toPayload,
  onChange,
}: UseSyncedFormSectionParams<TForm, TPayload>) {
  const lastPropValueRef = useRef('')

  useEffect(() => {
    const payload = toPayload(formValue)
    lastPropValueRef.current = JSON.stringify(payload)
    reset(formValue)
  }, [formValue, reset, toPayload])

  useEffect(() => {
    const subscription = watch((value) => {
      const payload = toPayload(value as TForm)
      const serialized = JSON.stringify(payload)

      if (serialized !== lastPropValueRef.current) {
        onChange(payload)
      }
    })

    return () => subscription.unsubscribe()
  }, [onChange, toPayload, watch])
}
