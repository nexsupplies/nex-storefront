import type { ReactNode } from 'react'
import Text from './Typography'

export default function PageIntro({
  label,
  title,
  body,
}: {
  label: ReactNode
  title: ReactNode
  body?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <Text variant="label">{label}</Text>
      <Text as="h1" variant="h1Hero">
        {title}
      </Text>
      {body ? <Text variant="bodyLg">{body}</Text> : null}
    </div>
  )
}
