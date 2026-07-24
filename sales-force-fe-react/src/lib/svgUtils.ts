export function updateSvgTextContent(
  textElement: Element,
  content: string,
  _doc: Document,
  debugInfo?: { unitName: string; fieldType: string }
): void {
  console.log(`[${debugInfo?.unitName || 'unknown'}] Updating ${debugInfo?.fieldType || 'field'}...`);
  console.log(`[${debugInfo?.unitName || 'unknown'}] Before update:`, textElement.outerHTML);
  
  const tspan = textElement.querySelector('tspan');
  if (tspan) {
    tspan.textContent = content;
    console.log(`[${debugInfo?.unitName || 'unknown'}] After update:`, textElement.outerHTML);
    console.log(`[${debugInfo?.unitName || 'unknown'}] ✅ ${debugInfo?.fieldType || 'field'} updated to: "${content}"`);
  } else {
    console.log(`[${debugInfo?.unitName || 'unknown'}] ❌ No tspan found for ${debugInfo?.fieldType || 'field'}`);
  }
}