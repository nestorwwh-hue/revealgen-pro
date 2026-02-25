import { EffectType, EffectProperties, getEffectCSS, getEffectJS } from './EffectEngine';

export const generateWebflowCode = (types: EffectType[], props: EffectProperties) => {
  const css = getEffectCSS(types, props);
  const js = getEffectJS(types, props);

  const gsapCDN = props.useGSAP ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>' : '';

  const splitScript = `
  const splitText = (el, mode) => {
    const text = el.innerText;
    el.innerHTML = '';
    el.setAttribute('data-rvl-text', text);
    
    let parts;
    if (mode === 'char') parts = text.split('');
    else if (mode === 'word') parts = text.split(/(\\s+)/);
    else parts = [text];
    
    parts.forEach(part => {
      const span = document.createElement('span');
      span.innerText = part === ' ' ? '\\u00A0' : part;
      span.className = '${props.className} rvl-item';
      span.style.display = 'inline-block';
      if (part === '\\n') span.style.display = 'block';
      el.appendChild(span);
    });
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
  
  const wrappers = document.querySelectorAll('.${baseClass}-wrapper');
  wrappers.forEach(w => splitText(w, "${props.splitMode}"));

  ${props.useGSAP ? gsapAnimation : ''}
  
  ${js}
});
</script>
`;
};
