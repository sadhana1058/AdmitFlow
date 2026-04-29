export async function notifySlack(
  message: string,
  urgency: 'info' | 'warning' | 'alert' = 'info'
): Promise<{ success: boolean }> {
  const emoji = urgency === 'alert' ? '🚨' : urgency === 'warning' ? '⚠️' : 'ℹ️'
  const res = await fetch(process.env.SLACK_WEBHOOK_URL as string, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: `${emoji} ${message}` }),
  })
  return { success: res.ok }
}
