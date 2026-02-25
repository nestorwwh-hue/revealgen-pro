import { EffectType, EffectProperties, getEffectCSS, getEffectJS } from './EffectEngine';

export const generateWebflowCode = (types: EffectType[], props: EffectProperties) => {
  const css = getEffectCSS(types, props);
  const js = getEffectJS(types, props);

  const gsapCDN = props.useGSAP ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>' : '';

  const splitScript = `
  const splitText = (el, mode) => {
    const splitParts = (text) => {
      if (mode === 'char') return text.split('');
      if (mode === 'word') return text.split(/(\\s+)/);
      return [text];
    };

    const makeItem = (part) => {
      const s = document.createElement('span');
      s.textContent = part === ' ' ? '\\u00A0' : part;
      s.className = '${props.className} rvl-item';
      s.style.display = 'inline-block';
      return s;
    };

    const processNode = (node) => {
      const frag = document.createDocumentFragment();
      if (node.nodeType === 3) {
        // Plain text node — split directly into rvl-item spans
        splitParts(node.textContent).forEach(part => {
          if (!part) return;
          frag.appendChild(makeItem(part));
        });
      } else if (node.nodeType === 1) {
        // Element node (e.g. <span class="text-span-4">) — shallow-clone it
        // for each part so its classes/inline-styles are preserved on every piece
        splitParts(node.textContent).forEach(part => {
          if (!part) return;
          const wrapper = node.cloneNode(false); // keeps classes & inline styles
          wrapper.style.display = 'inline-block';
          wrapper.appendChild(makeItem(part));
          frag.appendChild(wrapper);
        });
      }
      return frag;
    };

    // Snapshot children BEFORE clearing innerHTML
    const children = Array.from(el.childNodes).map(n => n.cloneNode(true));
    el.innerHTML = '';
    children.forEach(child => el.appendChild(processNode(child)));
  };`;

  // Merge GSAP properties
  const gsapVars: Record<string, any> = {
    opacity: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    filter: 'blur(0px)',
    clipPath: 'inset(0 0 0 0)',
    duration: props.duration,
    delay: props.delay,
    stagger: {
      each: props.stagger,
      from: props.staggerOrder === 'center' ? 'center' : props.staggerOrder === 'random' ? 'random' : props.staggerOrder === 'desc' ? 'end' : 'start'
    },
    ease: props.easing
  };

  const gsapAnimation = `
  const animateGSAP = (container) => {
    if (container.getAttribute('data-rvl-animated') === 'true' && "${props.trigger}" === 'scroll') return;
    container.setAttribute('data-rvl-animated', 'true');
    
    const targets = container.querySelectorAll('.rvl-item');
    gsap.to(targets, ${JSON.stringify(gsapVars)});
  };`;

  const baseClass = props.className.split(' ')[0];
  const resolvedSelector = props.targetSelector.trim()
    ? props.targetSelector.trim()
    : `.${baseClass}-wrapper`;

  return `
<!-- RevealGen PRO (Combined Effects): ${types.join(', ')} -->
${gsapCDN}
<style>
${css}
.${baseClass}-wrapper { display: inline-block; width: 100%; }
</style>

<script>
document.addEventListener('DOMContentLoaded', () => {
  ${splitScript}
  
  const wrappers = document.querySelectorAll('${resolvedSelector}');
  wrappers.forEach(w => splitText(w, "${props.splitMode}"));

  ${props.useGSAP ? gsapAnimation : ''}
  
  ${js}
});
</script>
`;
};
