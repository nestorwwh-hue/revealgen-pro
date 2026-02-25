import React, { useState, useEffect, useMemo } from 'react';
import {
    Settings, Play, Copy, Check, Info, Code as CodeIcon,
    Type, Zap, MousePointer2, Sparkles, Layers, Wand2, RefreshCw, Cpu, Plus, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import confetti from 'canvas-confetti';
import { EffectType, EffectProperties, defaultProperties, SplitMode, StaggerOrder, TriggerType } from './logic/EffectEngine';
import { generateWebflowCode } from './logic/CodeGenerator';

const PRESETS = [
    { name: 'Modern Fade', effects: ['fade', 'slide-up'], duration: 0.8, stagger: 0.05, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    { name: 'Apple Style', effects: ['fade', 'slide-up'], duration: 1.2, stagger: 0.02, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    { name: 'Hacker Text', effects: ['scramble', 'fade'], duration: 1.5, stagger: 0.1, easing: 'ease-out' },
    { name: '3D Flip Pro', effects: ['flip-3d', 'fade'], duration: 1.0, stagger: 0.08, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
    { name: 'Blur Entrance', effects: ['blur', 'fade'], duration: 0.8, stagger: 0.04, easing: 'ease-out' },
    { name: 'Mask Reveal', effects: ['mask-reveal'], duration: 1.0, stagger: 0.1, easing: 'power4.out' },
    { name: 'Mega Combo', effects: ['fade', 'slide-up', 'blur', 'scale'], duration: 1.0, stagger: 0.05, easing: 'ease-out' },
    { name: 'Glitchy Blur', effects: ['blur', 'fade', 'scale'], duration: 0.5, stagger: 0.03, easing: 'ease-in-out' },
];

const AVAILABLE_EFFECTS: { id: EffectType, name: string }[] = [
    { id: 'fade', name: 'Fade' },
    { id: 'slide-up', name: 'Slide Up' },
    { id: 'slide-down', name: 'Slide Down' },
    { id: 'blur', name: 'Blur' },
    { id: 'scale', name: 'Scale' },
    { id: 'flip-3d', name: '3D Flip' },
    { id: 'mask-reveal', name: 'Mask Reveal' },
    { id: 'scramble', name: 'Scramble' },
];

const GOOGLE_FONTS = ['Inter', 'Roboto', 'Outfit', 'Space Grotesk', 'Playfair Display', 'Syne'];

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'effects' | 'style' | 'code'>('effects');
    const [effects, setEffects] = useState<EffectType[]>(['slide-up', 'fade']);
    const [props, setProps] = useState<EffectProperties>(defaultProperties);
    const [previewFontSize, setPreviewFontSize] = useState(80);
    const [copied, setCopied] = useState(false);
    const [previewKey, setPreviewKey] = useState(0);

    const toggleEffect = (id: EffectType) => {
        setEffects(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    };

    const replay = () => setPreviewKey(prev => prev + 1);

    // Auto-replay on property change
    useEffect(() => {
        replay();
    }, [effects, props.duration, props.delay, props.stagger, props.splitMode, props.staggerOrder, props.easing, props.trigger]);

    const generatedCode = useMemo(() => generateWebflowCode(effects, props), [effects, props]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#0ea5e9', '#a855f7']
        });
        setTimeout(() => setCopied(false), 2000);
    };

    const applyPreset = (preset: typeof PRESETS[0]) => {
        setEffects(preset.effects as EffectType[]);
        setProps({ ...props, duration: preset.duration, stagger: preset.stagger, easing: preset.easing });
        setPreviewKey(prev => prev + 1);
    };

    // Scramble effect simulation for preview
    const [scrambledText, setScrambledText] = useState(props.text);
    useEffect(() => {
        if (!effects.includes('scramble')) {
            setScrambledText(props.text);
            return;
        }

        let iteration = 0;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
        const interval = setInterval(() => {
            setScrambledText(props.text.split('').map((char, index) => {
                if (index < iteration) return props.text[index];
                return chars[Math.floor(Math.random() * chars.length)];
            }).join(''));
            if (iteration >= props.text.length) clearInterval(interval);
            iteration += 1 / 2;
        }, 50);
        return () => clearInterval(interval);
    }, [previewKey, effects, props.text]);

    const previewItems = useMemo(() => {
        if (props.splitMode === 'char') return (effects.includes('scramble') ? scrambledText : props.text).split('');
        if (props.splitMode === 'word') return props.text.split(/(\s+)/);
        return [props.text];
    }, [props.text, props.splitMode, effects, scrambledText]);

    const staggerOrderIndices = useMemo(() => {
        const indices = Array.from({ length: previewItems.length }, (_, i) => i);
        if (props.staggerOrder === 'desc') return [...indices].reverse();
        if (props.staggerOrder === 'center') {
            const mid = (previewItems.length - 1) / 2;
            return [...indices].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
        }
        if (props.staggerOrder === 'random') {
            const seededRandom = (seed: number) => {
                const x = Math.sin(seed) * 10000;
                return x - Math.floor(x);
            };
            return [...indices].sort((a, b) => seededRandom(a + previewKey) - seededRandom(b + previewKey));
        }
        return indices;
    }, [previewItems.length, props.staggerOrder, previewKey]);

    const renderPreviewItem = (content: string, index: number) => {
        const isScramble = effects.includes('scramble');
        const displayContent = isScramble ? content : content;
        const staggerPriority = staggerOrderIndices.indexOf(index);

        const initial: any = { opacity: 0 };
        const animate: any = { opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)', clipPath: 'inset(0 0 0 0)' };

        effects.forEach(e => {
            if (e === 'slide-up') initial.y = 40;
            if (e === 'slide-down') initial.y = -40;
            if (e === 'blur') initial.filter = 'blur(15px)';
            if (e === 'scale') initial.scale = 0.8;
            if (e === 'flip-3d') {
                initial.rotateX = -90;
                initial.transformOrigin = 'top';
            }
            if (e === 'mask-reveal') initial.clipPath = 'inset(0 100% 0 0)';
        });

        return (
            <motion.span
                key={`${index}-${previewKey}`}
                initial={initial}
                animate={animate}
                transition={{
                    duration: props.duration,
                    delay: props.delay + (staggerPriority * props.stagger),
                    ease: props.easing as any
                }}
                className="inline-block"
                style={{ fontSize: `${previewFontSize}px`, lineHeight: 1, padding: '0.5em 1em', margin: '-0.5em -1em' }}
            >
                {displayContent === ' ' ? '\u00A0' : displayContent}
            </motion.span>
        );
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#020617] text-slate-100">
            <AnimatePresence>
                <aside className="w-full md:w-[400px] glass border-r border-white/5 flex flex-col h-screen overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <Sparkles className="text-white" size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold tracking-tight">RevealGen <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded ml-1 text-primary-400">PRO</span></h1>
                                    <p className="text-[10px] text-slate-500">Professional Text Motion Generator</p>
                                </div>
                            </div>
                            <button onClick={replay} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 hover:text-white">
                                <RefreshCw size={18} />
                            </button>
                        </div>

                        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
                            {(['effects', 'style', 'code'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize transition-all ${activeTab === tab ? 'bg-primary-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                        {activeTab === 'effects' ? (
                            <div className="space-y-6">
                                <section>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 block">Design Presets</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PRESETS.map(p => (
                                            <button key={p.name} onClick={() => applyPreset(p)} className="p-3 text-left bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-primary-500/30 transition-all group">
                                                <p className="text-xs font-medium group-hover:text-primary-400 transition-colors">{p.name}</p>
                                                <p className="text-[9px] text-slate-500 mt-1 capitalize">{p.effects.length} Effects</p>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 block">Animation Stack</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AVAILABLE_EFFECTS.map(eff => (
                                            <button
                                                key={eff.id}
                                                onClick={() => toggleEffect(eff.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${effects.includes(eff.id) ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'}`}
                                            >
                                                {eff.name}
                                                {effects.includes(eff.id) ? <Check size={14} /> : <Plus size={14} className="opacity-40" />}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Granularity</label>
                                    <div className="bg-slate-900 border border-white/10 rounded-xl p-1 flex">
                                        {(['char', 'word', 'line'] as SplitMode[]).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => setProps({ ...props, splitMode: mode })}
                                                className={`flex-1 py-2 text-xs font-medium rounded-lg capitalize ${props.splitMode === mode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Stagger Flow</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['asc', 'desc', 'center', 'random'] as StaggerOrder[]).map(order => (
                                            <button
                                                key={order}
                                                onClick={() => setProps({ ...props, staggerOrder: order })}
                                                className={`py-2.5 text-[11px] font-medium rounded-xl border capitalize ${props.staggerOrder === order ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/20'}`}
                                            >
                                                {order === 'asc' ? 'Forward' : order === 'desc' ? 'Backwards' : order === 'center' ? 'From Mid' : 'Randomize'}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        ) : activeTab === 'style' ? (
                            <div className="space-y-6">
                                <section className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-6">
                                    <header className="flex items-center gap-2 mb-2">
                                        <Zap size={16} className="text-yellow-400" />
                                        <h3 className="text-sm font-semibold">Motion Dynamics</h3>
                                    </header>
                                    <div className="space-y-5">
                                        {[
                                            { label: 'Duration', key: 'duration', min: 0.1, max: 3, step: 0.1, unit: 's' },
                                            { label: 'Delay', key: 'delay', min: 0, max: 5, step: 0.1, unit: 's' },
                                            { label: 'Stagger', key: 'stagger', min: 0, max: 0.5, step: 0.01, unit: 's' },
                                        ].map(ctrl => (
                                            <div key={ctrl.key}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs text-slate-400">{ctrl.label}</label>
                                                    <span className="text-[11px] font-mono text-primary-400 bg-primary-400/10 px-1.5 py-0.5 rounded">{props[ctrl.key as keyof EffectProperties]}{ctrl.unit}</span>
                                                </div>
                                                <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step} value={props[ctrl.key as keyof EffectProperties] as number} onChange={(e) => setProps({ ...props, [ctrl.key]: parseFloat(e.target.value) })} className="w-full accent-primary-500 h-1 bg-slate-800 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 block">Trigger Action</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['scroll', 'instant', 'hover', 'click'] as TriggerType[]).map(t => (
                                            <button key={t} onClick={() => setProps({ ...props, trigger: t })} className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-medium transition-all ${props.trigger === t ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'}`}>
                                                <span className="capitalize">{t}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-3 block">Webflow Target Class</label>
                                    <input type="text" value={props.className} onChange={(e) => setProps({ ...props, className: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none placeholder:text-slate-700" placeholder="e.g. hero-reveal custom-style" />
                                    <p className="text-[9px] text-slate-600 mt-2 italic">* Use spaces to add multiple classes. All classes will be applied to each letter/word.</p>
                                </section>

                                <section>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">GSAP Optimization</label>
                                        <button onClick={() => setProps({ ...props, useGSAP: !props.useGSAP })} className={`w-10 h-5 rounded-full relative transition-colors ${props.useGSAP ? 'bg-primary-500' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${props.useGSAP ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-600">Higher performance and smoother curves. Requires GSAP CDN script.</p>
                                </section>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={handleCopy} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white backdrop-blur-md border border-white/10 transition-all">
                                            {copied ? <Check size={16} /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                        <SyntaxHighlighter language="html" style={atomDark} customStyle={{ margin: 0, padding: '24px', fontSize: '11px', lineHeight: '1.6', background: '#0f172a' }}>
                                            {generatedCode}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-white/5 bg-slate-900/40">
                        <button onClick={handleCopy} className="w-full py-4 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary-500/20 transform active:scale-[0.98]">
                            {copied ? <Check size={18} /> : <CodeIcon size={18} />}
                            {copied ? 'Copied to Clipboard!' : 'Export Stack to Webflow'}
                        </button>
                    </div>
                </aside>
            </AnimatePresence>

            <main className="flex-1 relative flex flex-col p-8 md:p-12 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[150px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <header className="flex items-center justify-between mb-12 relative z-10">
                    <div /> {/* Spacer for flex layout */}
                </header>

                <section className="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div className="w-full max-w-4xl">
                        <div className="mb-12 text-center">
                            <textarea
                                value={props.text}
                                onChange={(e) => setProps({ ...props, text: e.target.value })}
                                className="w-full bg-transparent text-center font-black text-white outline-none resize-none placeholder:text-slate-800/50 transition-all focus:scale-105"
                                style={{ fontSize: '48px', lineHeight: 1.2 }}
                                rows={2}
                                placeholder="Type your text..."
                            />
                        </div>

                        <div className="glass-light rounded-[40px] p-12 md:p-20 border border-white/10 shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)] relative group overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
                            <div className="flex flex-wrap justify-center gap-x-[0.2em] gap-y-2 min-h-[160px] items-center text-center">
                                <AnimatePresence mode="popLayout">
                                    {previewItems.map((item, i) => renderPreviewItem(item, i))}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-4">
                            <div className="flex items-center gap-6 bg-slate-900/40 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preview Font Size</label>
                                <div className="flex items-center gap-4 w-64">
                                    <input type="range" min="12" max="200" step="1" value={previewFontSize} onChange={(e) => setPreviewFontSize(parseInt(e.target.value))} className="flex-1 accent-primary-500 h-1 bg-slate-800 rounded-full" />
                                    <span className="text-[11px] font-mono text-primary-400 w-10 text-right">{previewFontSize}px</span>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-600 italic">This setting is for preview purposes only and is not included in the exported Webflow code.</p>
                        </div>
                    </div>
                </section>
            </main>

            <style>{`
                .glass { background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
                .glass-light { background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default App;
