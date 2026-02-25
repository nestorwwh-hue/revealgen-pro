export type EffectType = 'fade' | 'slide-up' | 'slide-down' | 'blur' | 'scale' | 'reveal-center' | 'scramble' | 'flip-3d' | 'mask-reveal' | 'typewriter';
export type SplitMode = 'char' | 'word' | 'line';
export type StaggerOrder = 'asc' | 'desc' | 'center' | 'random';
export type TriggerType = 'scroll' | 'instant' | 'hover' | 'click';

export interface EffectProperties {
  duration: number;
  delay: number;
  stagger: number;
  easing: string;
  className: string;
  text: string;
  trigger: TriggerType;
  splitMode: SplitMode;
  staggerOrder: StaggerOrder;
  fontFamily: string;
  useGSAP: boolean;
}

export const defaultProperties: EffectProperties = {
  duration: 0.8,
  delay: 0,
  stagger: 0.05,
  easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
  className: 'reveal-element',
  text: 'Combined Reveal Effect',
  trigger: 'scroll',
  splitMode: 'char',
  staggerOrder: 'asc',
  fontFamily: 'Inter',
  useGSAP: true,
};

export const getEffectCSS = (types: EffectType[], props: EffectProperties) => {
  const { duration, easing, className } = props;

  let transform = '';
  let filter = '';
  let opacity = '0';
  let clipPath = '';
  let transition = `opacity ${duration}s ${easing}, transform ${duration}s ${easing}, filter ${duration}s ${easing}, clip-path ${duration}s ${easing}`;

  types.forEach(type => {
    switch (type) {
      case 'fade': opacity = '0'; break;
      case 'slide-up': transform += ' translateY(40px)'; break;
      case 'slide-down': transform += ' translateY(-40px)'; break;
      case 'blur': filter += ' blur(15px)'; break;
      case 'scale': transform += ' scale(0.8)'; break;
      case 'flip-3d': transform += ' perspective(1000px) rotateX(-90deg)'; break;
      case 'mask-reveal': clipPath = 'inset(0 100% 0 0)'; break;
    }
  });

  const selector = className.split(' ').filter(Boolean).map(c => '.' + c).join('');

  return `
${selector} {
  opacity: ${opacity};
  filter: ${filter || 'none'};
  transform: ${transform || 'none'};
  ${clipPath ? `clip-path: ${clipPath};` : ''}
  transition: ${transition};
  will-change: opacity, transform, filter, clip-path;
  display: inline-block;
  padding: 0.5em 1em;
  margin: -0.5em -1em;
  white-space: pre;
  overflow: visible !important;
}

${selector}.is-visible {
  opacity: 1 !important;
  transform: translate(0, 0) rotateX(0) rotateY(0) scale(1) !important;
  filter: blur(0) !important;
  ${clipPath ? 'clip-path: inset(0 0 0 0) !important;' : ''}
}
`;
};

export const getEffectJS = (types: EffectType[], props: EffectProperties) => {
  const { stagger, delay, className, trigger, staggerOrder } = props;
  const hasScramble = types.includes('scramble');

  const getOrderScript = `
    let targets = container.querySelectorAll('.rvl-item');
    if (!targets.length) targets = [container];
    const items = Array.from(targets);
    
    let ordered;
    if ("${staggerOrder}" === 'desc') ordered = items.reverse();
    else if ("${staggerOrder}" === 'center') {
      const mid = Math.floor(items.length / 2);
      ordered = [...items].sort((a, b) => {
        const distA = Math.abs(items.indexOf(a) - mid);
        const distB = Math.abs(items.indexOf(b) - mid);
        return distA - distB;
      });
    } else if ("${staggerOrder}" === 'random') {
      ordered = items.sort(() => Math.random() - 0.5);
    } else {
      ordered = items;
    }
  `;

  const scrambleScript = `
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    const scramble = (el, originalText) => {
      let iteration = 0;
      const interval = setInterval(() => {
        el.innerText = originalText.split('').map((char, index) => {
          if(index < iteration) return originalText[index];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        if(iteration >= originalText.length) clearInterval(interval);
        iteration += 1 / 3;
      }, 30);
    }
  `;

  const baseClass = className.split(' ')[0];

  return `
(function() {
  ${hasScramble ? scrambleScript : ''}
  const elements = document.querySelectorAll('.${baseClass}-wrapper');
  if (!elements.length) return;

  const animateElements = (container) => {
    if (container.getAttribute('data-rvl-animated') === 'true' && "${trigger}" === 'scroll') return;
    container.setAttribute('data-rvl-animated', 'true');

    ${getOrderScript}
    
    ordered.forEach((el, index) => {
      setTimeout(() => {
        el.classList.add('is-visible');
        ${hasScramble ? `
        const originalText = el.getAttribute('data-rvl-text') || el.innerText;
        scramble(el, originalText);` : ''}
      }, ${delay * 1000} + (index * ${stagger * 1000}));
    });
  };

  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateElements(entry.target);
        if ("${trigger}" === 'scroll') observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  elements.forEach((el) => {
    if ("${trigger}" === 'scroll') observer.observe(el);
    else if ("${trigger}" === 'instant') animateElements(el);
    else if ("${trigger}" === 'hover') el.addEventListener('mouseenter', () => animateElements(el));
    else if ("${trigger}" === 'click') el.addEventListener('click', () => animateElements(el));
  });
})();
`;
};
