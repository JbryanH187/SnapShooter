import React from 'react';
import { useTemplateStore } from '../../stores/templateStore';
import { TemplateBlock } from '../../../shared/types';
import { Camera, Type, LayoutGrid, Image as ImageIcon, Upload, Scissors, Table as TableIcon, AlignLeft, AlignCenter, AlignRight, Square, Circle } from 'lucide-react';

interface BlockProps {
    block: TemplateBlock;
    isOverlay?: boolean;
}

// ----------------------------------------------------------------------
// Header Block
// ----------------------------------------------------------------------
export const HeaderBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    const { updateBlock } = useTemplateStore();
    const { title, logo, showDate } = block.content;

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateBlock(block.id, { logo: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`p-4 border-b-2 border-gray-100 ${isOverlay ? 'bg-white shadow-xl' : ''}`}>
            <div className="flex justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Header</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => updateBlock(block.id, { variant: 'classic' })}
                        className={`px-2 py-1 text-xs rounded border ${block.settings?.variant === 'classic' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200'}`}
                    >Classic</button>
                    <button
                        onClick={() => updateBlock(block.id, { variant: 'modern' })}
                        className={`px-2 py-1 text-xs rounded border ${block.settings?.variant === 'modern' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200'}`}
                    >Modern</button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative group">
                    {logo ? (
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-12 w-auto object-contain"
                            style={{ maxWidth: '150px' }}
                        />
                    ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            <ImageIcon size={20} />
                        </div>
                    )}
                    {/* Upload Overlay */}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-lg text-white">
                        <Upload size={16} />
                        <input type="file" className="hidden" accept="image/*,.svg" onChange={handleLogoUpload} />
                    </label>
                </div>
                <div className="flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                        className="text-xl font-bold bg-transparent border-none focus:ring-0 p-0 placeholder-gray-300 w-full"
                        placeholder="Report Title"
                    />
                    {showDate && (
                        <div className="text-sm text-gray-500">
                            {new Date().toLocaleDateString()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Page Break Block
// ----------------------------------------------------------------------
export const PageBreakBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    return (
        <div className={`relative ${isOverlay ? 'bg-white shadow-xl p-4' : ''}`}>
            {isOverlay ? (
                // Overlay Preview
                <div className="flex items-center gap-4">
                    <div className="h-px bg-red-200 flex-1 border-dashed border-t-2 border-red-300"></div>
                    <div className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
                        <Scissors size={14} /> Page Break
                    </div>
                    <div className="h-px bg-red-200 flex-1 border-dashed border-t-2 border-red-300"></div>
                </div>
            ) : (
                // Visual Gap / Page Separation
                // We fake a "gap" between papers.
                // The parent (canvas) should handle the white paper background, so here we force a break in that.
                // Actually, the blocks are INSIDE the white "paper". 
                // To simulate a new page, we might need a visually distinct separator that LOOKS like a gap.
                <div className="py-8 bg-gray-100 flex items-center justify-center -mx-8 relative overflow-hidden my-4 border-y border-gray-200 shadow-inner">
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 z-10 border rounded-full">
                        Page Break
                    </div>
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// Logo Block
// ----------------------------------------------------------------------
export const LogoBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    const { updateBlock } = useTemplateStore();
    const { image, width, alignment } = block.content;

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => updateBlock(block.id, { image: reader.result });
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`p-4 ${isOverlay ? 'bg-white shadow-xl' : ''}`}>
            <div className={`flex justify-${alignment === 'center' ? 'center' : alignment === 'right' ? 'end' : 'start'}`}>
                <div className="relative group inline-block">
                    {image ? (
                        <img
                            src={image}
                            alt="Logo"
                            className="object-contain border border-transparent group-hover:border-dashed group-hover:border-blue-300 rounded"
                            style={{ width: `${width}px`, maxWidth: '100%' }}
                        />
                    ) : (
                        <div className="h-24 w-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                            <ImageIcon size={24} />
                            <span className="text-xs mt-2">Upload Image</span>
                        </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded text-white">
                        <Upload size={16} />
                        <input type="file" className="hidden" accept="image/*,.svg" onChange={handleUpload} />
                    </label>
                </div>
            </div>
            {/* Controls */}
            <div className="mt-2 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => updateBlock(block.id, { alignment: 'left' })} className={`p-1 rounded ${alignment === 'left' ? 'bg-white shadow-sm' : ''}`}><AlignLeft size={14} /></button>
                    <button onClick={() => updateBlock(block.id, { alignment: 'center' })} className={`p-1 rounded ${alignment === 'center' ? 'bg-white shadow-sm' : ''}`}><AlignCenter size={14} /></button>
                    <button onClick={() => updateBlock(block.id, { alignment: 'right' })} className={`p-1 rounded ${alignment === 'right' ? 'bg-white shadow-sm' : ''}`}><AlignRight size={14} /></button>
                </div>
                <input
                    type="range"
                    min="50" max="500"
                    value={width || 150}
                    onChange={(e) => updateBlock(block.id, { width: parseInt(e.target.value) })}
                    className="w-24"
                />
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Table Block
// ----------------------------------------------------------------------
export const TableBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    const { updateBlock } = useTemplateStore();
    const { rows, cols } = block.content;

    return (
        <div className={`p-4 ${isOverlay ? 'bg-white shadow-xl' : ''}`}>
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-gray-500">
                    <TableIcon size={16} />
                    <span className="text-sm font-medium">Table Configuration</span>
                </div>
                <div className="flex gap-2 text-xs">
                    <label>
                        Rows: <input type="number" min="1" max="20" value={rows} onChange={(e) => updateBlock(block.id, { rows: parseInt(e.target.value) })} className="w-12 border rounded px-1" />
                    </label>
                    <label>
                        Cols: <input type="number" min="1" max="10" value={cols} onChange={(e) => updateBlock(block.id, { cols: parseInt(e.target.value) })} className="w-12 border rounded px-1" />
                    </label>
                </div>
            </div>

            <div className="grid gap-px bg-gray-200 border border-gray-200 rounded overflow-hidden" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {Array.from({ length: rows * cols }).map((_, i) => (
                    <div key={i} className="bg-white p-2 min-h-[30px] flex items-center justify-center text-xs text-gray-300">
                        Cell
                    </div>
                ))}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Text / Summary / Conclusion
// ----------------------------------------------------------------------
export const TextSectionBlock: React.FC<BlockProps & { placeholder: string }> = ({ block, isOverlay, placeholder }) => {
    const { updateBlock } = useTemplateStore();
    const { text } = block.content;

    return (
        <div className={`p-4 ${isOverlay ? 'bg-white shadow-xl' : ''}`}>
            {block.type !== 'text' && (
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {block.type}
                </div>
            )}
            <textarea
                value={text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                className="w-full min-h-[60px] text-gray-700 bg-transparent border-none resize-none focus:ring-1 focus:ring-blue-100 rounded"
                placeholder={placeholder}
            />
        </div>
    );
};

// ----------------------------------------------------------------------
// Evidence Block
// ----------------------------------------------------------------------
export const EvidenceBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    const { updateBlock } = useTemplateStore();
    const { title, description, layout } = block.content;

    return (
        <div className={`p-4 ${isOverlay ? 'bg-white shadow-xl' : ''}`}>
            <div className="mb-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                    className="font-bold bg-transparent border-none focus:ring-0 p-0 text-gray-800 w-full"
                    placeholder="Evidence Title"
                />
            </div>
            <div className={`flex gap-4 ${layout === 'split-right' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="w-1/3 aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                    <Camera size={24} />
                    <span className="text-xs ml-2">Capture</span>
                </div>
                <div className="flex-1">
                    <textarea
                        value={description}
                        onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                        className="w-full h-full min-h-[80px] text-sm text-gray-600 bg-transparent border-none resize-none focus:ring-1 focus:ring-blue-100 rounded"
                        placeholder="Description..."
                    />
                </div>
            </div>
        </div>
    );
};

export const GridBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    return (
        <div className={`p-4 ${isOverlay ? 'bg-white shadow-xl' : ''}`}>
            <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Image Grid</div>
            <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center">
                        <ImageIcon size={16} className="text-gray-300" />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// Footer Block
// ----------------------------------------------------------------------
export const FooterBlock: React.FC<BlockProps> = ({ block, isOverlay }) => {
    const { updateBlock } = useTemplateStore();
    const { text } = block.content;

    return (
        <div className={`p-4 border-t-2 border-gray-100 mt-4 bg-gray-50 ${isOverlay ? 'shadow-xl' : ''}`}>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Footer</div>
            <input
                type="text"
                value={text}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                className="w-full text-xs text-center text-gray-500 bg-transparent border-none focus:ring-0 p-1 placeholder-gray-300"
                placeholder="Footer Text"
            />
        </div>
    );
};


// ----------------------------------------------------------------------
// Blocks Switcher
// ----------------------------------------------------------------------
export const BlockRenderer: React.FC<BlockProps> = (props) => {
    const { block } = props;
    switch (block.type) {
        case 'header': return <HeaderBlock {...props} />;
        case 'evidence': return <EvidenceBlock {...props} />;
        case 'text': return <TextSectionBlock {...props} placeholder="Enter content..." />;
        case 'summary': return <TextSectionBlock {...props} placeholder="Executive Summary..." />;
        case 'conclusion': return <TextSectionBlock {...props} placeholder="Final Conclusion..." />;
        case 'toc': return <div className="p-4 bg-gray-50 text-center text-gray-400 font-mono text-sm border border-dashed">Table of Contents (Auto-generated)</div>;
        case 'grid': return <GridBlock {...props} />;
        case 'logo': return <LogoBlock {...props} />;
        case 'table': return <TableBlock {...props} />;
        case 'footer': return <FooterBlock {...props} />;
        case 'page-break': return <PageBreakBlock {...props} />;
        default: return <div className="p-4 text-red-500">Unknown block type</div>;
    }
};
