export async function copyText(text: string): Promise<boolean> {
  try {
    await window.api.clipboard.write(text);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
}
