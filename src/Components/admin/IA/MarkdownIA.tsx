// Affichage des réponses de l'IA (Markdown) aux couleurs de Lumistock.
// remark-gfm ajoute les tableaux, listes de tâches et texte barré.
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MarkdownIA: React.FC<{ texte: string; sombre?: boolean }> = ({ texte, sombre = false }) => {
  const titre = sombre ? "text-white" : "text-purple-950";
  const corps = sombre ? "text-purple-100" : "text-slate-700";
  const fort = sombre ? "text-white" : "text-slate-900";

  return (
    <div className={`text-[14.5px] leading-relaxed ${corps}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node: _n, ...p }) => <h3 className={`mb-2 mt-4 text-base font-bold first:mt-0 ${titre}`} {...p} />,
          h2: ({ node: _n, ...p }) => <h3 className={`mb-2 mt-4 text-[15px] font-bold first:mt-0 ${titre}`} {...p} />,
          h3: ({ node: _n, ...p }) => <h4 className={`mb-1.5 mt-3 text-sm font-semibold first:mt-0 ${titre}`} {...p} />,
          p: ({ node: _n, ...p }) => <p className="mb-2.5 last:mb-0" {...p} />,
          strong: ({ node: _n, ...p }) => <strong className={`font-semibold ${fort}`} {...p} />,
          ul: ({ node: _n, ...p }) => <ul className="mb-2.5 list-disc space-y-1 pl-5 marker:text-fuchsia-500 last:mb-0" {...p} />,
          ol: ({ node: _n, ...p }) => <ol className="mb-2.5 list-decimal space-y-1 pl-5 marker:font-semibold marker:text-purple-700 last:mb-0" {...p} />,
          li: ({ node: _n, ...p }) => <li className="pl-0.5" {...p} />,
          a: ({ node: _n, ...p }) => <a className="font-medium !text-purple-700 underline" target="_blank" rel="noreferrer" {...p} />,
          blockquote: ({ node: _n, ...p }) => (
            <blockquote className="mb-2.5 border-l-4 border-fuchsia-300 bg-fuchsia-50/60 py-1.5 pl-3 pr-2 text-slate-700" {...p} />
          ),
          code: ({ node: _n, ...p }) => <code className="rounded bg-purple-50 px-1.5 py-0.5 text-[13px] text-purple-900" {...p} />,
          hr: () => <hr className="my-3 border-slate-200" />,
          table: ({ node: _n, ...p }) => (
            <div className="mb-2.5 overflow-x-auto scrollbar-hide rounded-xl ring-1 ring-slate-200 last:mb-0">
              <table className="w-full border-collapse text-left text-[13px]" {...p} />
            </div>
          ),
          thead: ({ node: _n, ...p }) => <thead className="bg-purple-50 text-purple-950" {...p} />,
          th: ({ node: _n, ...p }) => <th className="whitespace-nowrap px-3 py-2 font-semibold" {...p} />,
          td: ({ node: _n, ...p }) => <td className="border-t border-slate-100 px-3 py-2 tabular-nums" {...p} />,
        }}
      >
        {texte}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownIA;
