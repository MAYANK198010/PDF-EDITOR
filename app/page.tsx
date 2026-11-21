"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Scissors, Combine, RotateCw, Minimize2, Image, ShieldCheck, Droplets, FileImage, ArrowRight, UploadCloud, X, Download, CheckCircle2, LockKeyhole, Search, Menu, Sparkles, Files, Trash2 } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";

type ToolId = "merge" | "split" | "rotate" | "compress" | "images" | "watermark" | "protect" | "preview";
type PdfFile = { file: File; id: string };

const tools: {id:ToolId;name:string;description:string;icon:typeof FileText;category:string;accent:string}[] = [
  {id:"merge",name:"Merge PDF",description:"Combine PDFs in the order you choose.",icon:Combine,category:"Organize",accent:"green"},
  {id:"split",name:"Split PDF",description:"Extract pages into a separate document.",icon:Scissors,category:"Organize",accent:"blue"},
  {id:"rotate",name:"Rotate PDF",description:"Turn pages to the correct orientation.",icon:RotateCw,category:"Organize",accent:"orange"},
  {id:"compress",name:"Compress PDF",description:"Rewrite a PDF to optimize its structure.",icon:Minimize2,category:"Optimize",accent:"purple"},
  {id:"images",name:"Images to PDF",description:"Turn JPG and PNG images into a PDF.",icon:Image,category:"Convert",accent:"pink"},
  {id:"watermark",name:"Watermark PDF",description:"Stamp a text watermark onto every page.",icon:Droplets,category:"Edit",accent:"cyan"},
  {id:"protect",name:"Protect PDF",description:"Add a password to a PDF file.",icon:LockKeyhole,category:"Secure",accent:"amber"},
  {id:"preview",name:"PDF details",description:"Inspect page count and document size.",icon:FileImage,category:"View",accent:"slate"}
];

const iconColors: Record<string,string> = {green:"bg-emerald-50 text-emerald-700",blue:"bg-blue-50 text-blue-700",orange:"bg-orange-50 text-orange-700",purple:"bg-violet-50 text-violet-700",pink:"bg-pink-50 text-pink-700",cyan:"bg-cyan-50 text-cyan-700",amber:"bg-amber-50 text-amber-700",slate:"bg-slate-100 text-slate-700"};

export default function Home() {
  const [active, setActive] = useState<ToolId | null>(null);
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [dragging,setDragging] = useState(false);
  const [query,setQuery] = useState("");
  const [rotation,setRotation] = useState(90);
  const [watermark,setWatermark] = useState("CONFIDENTIAL");
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const selectedTool = tools.find(t=>t.id===active);
  const filtered = useMemo(()=>tools.filter(t=>(t.name+" "+t.description+" "+t.category).toLowerCase().includes(query.toLowerCase())),[query]);

  function addFiles(list: FileList | File[]) {
    const accepted = Array.from(list).filter(f=>f.type==="application/pdf" || (active==="images" && f.type.startsWith("image/")));
    if (!accepted.length) { setMessage("Choose a supported PDF file" + (active==="images" ? " or image." : ".")); return; }
    setFiles(old=>[...old,...accepted.map(file=>({file,id: crypto.randomUUID()}))]);
    setMessage("");
  }
  function reset() { setFiles([]); setMessage(""); if(inputRef.current) inputRef.current.value=""; if(imageRef.current) imageRef.current.value=""; }
  function download(bytes: Uint8Array, name: string) {
    const blob = new Blob([bytes.slice().buffer as ArrayBuffer],{type:"application/pdf"});
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
  }
  async function runTool() {
    if (!active || !files.length) return;
    setBusy(true); setMessage("");
    try {
      if(active==="merge") {
        if(files.length<2) throw new Error("Add at least two PDF files to merge.");
        const merged=await PDFDocument.create();
        for(const item of files) { const source=await PDFDocument.load(await item.file.arrayBuffer()); const pages=await merged.copyPages(source,source.getPageIndices()); pages.forEach(p=>merged.addPage(p)); }
        download(await merged.save(), "merged-document.pdf"); setMessage("Your merged PDF is ready.");
      } else if(active==="split") {
        const source=await PDFDocument.load(await files[0].file.arrayBuffer()); const count=source.getPageCount();
        if(count<2) throw new Error("This PDF has only one page. There is nothing to split.");
        const first=await PDFDocument.create(); first.addPage((await first.copyPages(source,[0]))[0]);
        download(await first.save(),"page-1.pdf");
        const rest=await PDFDocument.create(); (await rest.copyPages(source,source.getPageIndices().slice(1))).forEach(p=>rest.addPage(p));
        download(await rest.save(),"remaining-pages.pdf"); setMessage("Downloaded page 1 and the remaining pages as separate PDFs.");
      } else if(active==="rotate") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        doc.getPages().forEach(p=>p.setRotation(degrees((p.getRotation().angle+rotation)%360)));
        download(await doc.save(),"rotated.pdf"); setMessage("Your rotated PDF is ready.");
      } else if(active==="compress") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        download(await doc.save({useObjectStreams:true,addDefaultPage:false}),"optimized.pdf");
        setMessage("PDF rewritten with object streams. This may not reduce every document's size; image-heavy PDFs need image recompression.");
      } else if(active==="watermark") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        const font=await doc.embedFont("Helvetica");
        doc.getPages().forEach(page=>{const {width,height}=page.getSize(); page.drawText(watermark,{x:width*.18,y:height*.48,size:30,font,color:{type:"RGB",red:.72,green:.72,blue:.72},rotate:degrees(-35),opacity:.35});});
        download(await doc.save(),"watermarked.pdf"); setMessage("Your watermarked PDF is ready.");
      } else if(active==="images") {
        const doc=await PDFDocument.create();
        for(const item of files) {
          const bytes=new Uint8Array(await item.file.arrayBuffer());
          const image=item.file.type==="image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const page=doc.addPage([image.width,image.height]); page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});
        }
        download(await doc.save(),"images.pdf"); setMessage("Your image PDF is ready.");
      } else if(active==="protect") {
        throw new Error("Password encryption is not supported by this browser-side PDF library. This tool is shown as unavailable rather than pretending the file is protected.");
      } else if(active==="preview") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer()); setMessage("Document has "+doc.getPageCount()+" pages · "+(files[0].file.size/1024).toFixed(1)+" KB · "+(doc.getTitle()||"No title metadata"));
      }
    } catch(e) { setMessage(e instanceof Error?e.message:"Could not process this file. Check that it is a valid, unencrypted PDF."); }
    finally { setBusy(false); }
  }

  return <main>
    <header className="border-b border-emerald-100 bg-white/90 backdrop-blur sticky top-0 z-30">
      <div className="shell flex h-[72px] items-center justify-between gap-5">
        <button onClick={()=>{setActive(null);reset();}} className="flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#153d2c] text-white"><FileText size={21}/></span>
          <span><span className="block font-['Manrope'] text-[19px] font-extrabold tracking-tight">PDF EDITOR<span className="text-emerald-600">.</span></span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">Simple document tools</span></span>
        </button>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex"><a href="#tools" className="hover:text-emerald-700">All tools</a><a href="#privacy" className="hover:text-emerald-700">Privacy</a><a href="#about" className="hover:text-emerald-700">About</a></nav>
        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"><ShieldCheck size={15}/> Files stay on your device</div>
      </div>
    </header>

    <section className="shell pb-12 pt-16 text-center md:pb-16 md:pt-24">
      <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm"><Sparkles size={14}/> Your everyday PDF workspace</div>
      <h1 className="mx-auto max-w-3xl font-['Manrope'] text-4xl font-extrabold leading-[1.12] tracking-[-.045em] text-[#172b21] md:text-6xl">Kaam ki cheez.<br/><span className="text-emerald-700">Bina bakwaas.</span></h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-500 md:text-lg">Useful PDF tools that get straight to the point. Merge, split, rotate and convert documents without complicated steps.</p>
      <div className="mx-auto mt-9 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row"><a href="#tools" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f2d] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 sm:w-auto">Explore PDF tools <ArrowRight size={16}/></a><span className="flex items-center gap-2 text-xs font-semibold text-slate-400"><ShieldCheck size={15} className="text-emerald-600"/> No signup · Browser processing</span></div>
    </section>

    <section id="tools" className="shell pb-20">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">The toolkit</p><h2 className="font-['Manrope'] text-2xl font-extrabold tracking-tight md:text-3xl">What do you need to do?</h2><p className="mt-2 text-sm text-slate-500">Choose a tool to get started.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400 focus-within:border-emerald-500"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a PDF tool..." className="w-full bg-transparent text-sm text-slate-800 outline-none sm:w-52"/></label></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(tool=>{const Icon=tool.icon;return <button key={tool.id} onClick={()=>{setActive(tool.id);reset();}} className="tool-card rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_18px_rgba(28,55,43,.035)]"><span className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${iconColors[tool.accent]}`}><Icon size={21}/></span><span className="block font-['Manrope'] text-base font-extrabold">{tool.name}</span><span className="mt-1.5 block min-h-10 text-sm leading-5 text-slate-500">{tool.description}</span><span className="mt-4 flex items-center justify-between text-xs font-bold text-emerald-700"><span>{tool.category}</span><ArrowRight size={15}/></span></button>})}</div>
      {filtered.length===0 && <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">No tools match that search.</p>}
    </section>

    <section id="privacy" className="border-y border-emerald-100 bg-[#edf7f0] py-14"><div className="shell grid gap-8 md:grid-cols-3"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><ShieldCheck/></span><div><h3 className="font-bold">Private by design</h3><p className="mt-1 text-sm leading-6 text-slate-600">Selected PDF operations run locally in your browser. Files are not uploaded to our server.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><Files/></span><div><h3 className="font-bold">Straightforward tools</h3><p className="mt-1 text-sm leading-6 text-slate-600">Focused workflows with clear controls and downloadable results.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><Sparkles/></span><div><h3 className="font-bold">Made for everyday use</h3><p className="mt-1 text-sm leading-6 text-slate-600">A clean workspace that works across desktop, tablet and mobile screens.</p></div></div></div></section>

    <footer id="about" className="shell flex flex-col justify-between gap-4 py-8 text-xs text-slate-400 sm:flex-row"><p>© {new Date().getFullYear()} PDF EDITOR. Simple tools for everyday documents.</p><p>Local processing where supported · No account required</p></footer>

    {active && selectedTool && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#10251b]/55 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget){setActive(null);reset();}}}>
      <div className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">{selectedTool.category} tool</p><h2 className="mt-1 font-['Manrope'] text-2xl font-extrabold">{selectedTool.name}</h2><p className="mt-1 text-sm text-slate-500">{selectedTool.description}</p></div><button aria-label="Close tool" onClick={()=>{setActive(null);reset();}} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={18}/></button></div>
        <div className="p-6">
          <input ref={inputRef} type="file" accept={active==="images"?"image/png,image/jpeg":"application/pdf"} multiple={active==="merge"||active==="images"} className="hidden" onChange={e=>e.target.files&&addFiles(e.target.files)}/>
          <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}} onClick={()=>inputRef.current?.click()} className={`dropzone flex cursor-pointer flex-col items-center rounded-2xl px-5 py-9 text-center ${dragging?"dragging":""}`}><span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm"><UploadCloud size={24}/></span><span className="font-bold">Drop your {active==="images"?"images":"PDF"} here</span><span className="mt-1 text-xs text-slate-500">or click to browse files</span><span className="mt-4 rounded-lg bg-[#173f2d] px-4 py-2 text-xs font-bold text-white">Choose {active==="images"?"images":"PDF files"}</span></div>
          {files.length>0 && <div className="mt-4 space-y-2">{files.map((item,i)=><div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"><FileText size={18} className="shrink-0 text-emerald-700"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.file.name}</p><p className="text-xs text-slate-400">{(item.file.size/1024).toFixed(1)} KB</p></div>{active==="merge"&&<span className="text-xs text-slate-400">#{i+1}</span>}<button aria-label="Remove file" onClick={()=>setFiles(old=>old.filter(f=>f.id!==item.id))} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600"><Trash2 size={15}/></button></div>)}</div>}
          {active==="rotate"&&<div className="mt-5"><label className="mb-2 block text-sm font-semibold">Rotation angle</label><div className="grid grid-cols-3 gap-2">{[90,180,270].map(n=><button key={n} onClick={()=>setRotation(n)} className={`rounded-xl border py-2 text-sm font-bold ${rotation===n?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{n}°</button>)}</div></div>}
          {active==="watermark"&&<div className="mt-5"><label className="mb-2 block text-sm font-semibold">Watermark text</label><input value={watermark} onChange={e=>setWatermark(e.target.value)} maxLength={40} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"/></div>}
          {message && <p className={`mt-4 rounded-xl p-3 text-sm ${message.includes("ready")||message.includes("Downloaded")||message.includes("pages")?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}>{message}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Clear files</button><button disabled={!files.length||busy||(active==="merge"&&files.length<2)||(active==="watermark"&&!watermark.trim())} onClick={runTool} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f2d] px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{busy?"Processing…":active==="preview"?"Inspect PDF":"Process and download"} <Download size={16}/></button></div>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400"><ShieldCheck size={13}/> Files are processed in this browser tab.</p>
        </div>
      </div>
    </div>}
  </main>;
}