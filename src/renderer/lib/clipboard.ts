export async function copyText(text: string): Promise<boolean> {
  try {
    await window.api.clipboard.write(text);
    return true;
  } catch (err) {
    console.warn('[clipboard] IPC write failed, trying fallback:', err);
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err2) {
      console.error('[clipboard] All copy methods failed:', err2);
      return false;
    }
  }
}
