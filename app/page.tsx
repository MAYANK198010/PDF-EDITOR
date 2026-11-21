"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Scissors, Combine, RotateCw, Minimize2, Image, ShieldCheck, Droplets, FileImage, ArrowRight, UploadCloud, X, Download, LockKeyhole, Search, Sparkles, Files, Trash2, ListPlus, Eraser, Hash, Tags, ChevronUp, ChevronDown } from "lucide-react";
import { PDFDocument, degrees, rgb } from "pdf-lib";

type ToolId = "merge" | "split" | "rotate" | "compress" | "images" | "watermark" | "protect" | "preview" | "extract" | "delete" | "number" | "metadata" | "reorder" | "duplicate" | "toimages" | "blank" | "visual";
type PdfFile = { file: File; id: string };

const tools: {id:ToolId;name:string;description:string;icon:typeof FileText;category:string;accent:string}[] = [
  {id:"merge",name:"Merge PDF",description:"Combine PDFs in the order you choose.",icon:Combine,category:"Organize",accent:"green"},
  {id:"split",name:"Split PDF",description:"Extract pages into a separate document.",icon:Scissors,category:"Organize",accent:"blue"},
  {id:"rotate",name:"Rotate PDF",description:"Turn pages to the correct orientation.",icon:RotateCw,category:"Organize",accent:"orange"},
  {id:"compress",name:"Compress PDF",description:"Rewrite a PDF to optimize its structure.",icon:Minimize2,category:"Optimize",accent:"purple"},
  {id:"images",name:"Images to PDF",description:"Turn JPG and PNG images into a PDF.",icon:Image,category:"Convert",accent:"pink"},
  {id:"watermark",name:"Watermark PDF",description:"Stamp a text watermark onto every page.",icon:Droplets,category:"Edit",accent:"cyan"},
  {id:"protect",name:"Protect PDF",description:"Add a password to a PDF file.",icon:LockKeyhole,category:"Secure",accent:"amber"},
  {id:"preview",name:"PDF details",description:"Inspect page count and document size.",icon:FileImage,category:"View",accent:"slate"},
  {id:"extract",name:"Extract pages",description:"Save selected pages into a new PDF.",icon:ListPlus,category:"Organize",accent:"blue"},
  {id:"delete",name:"Delete pages",description:"Remove selected pages from a PDF.",icon:Eraser,category:"Organize",accent:"orange"},
  {id:"number",name:"Page numbers",description:"Add page numbers to every page.",icon:Hash,category:"Edit",accent:"purple"},
  {id:"metadata",name:"Edit metadata",description:"Update title, author and document details.",icon:Tags,category:"Edit",accent:"cyan"},
  {id:"reorder",name:"Reorder pages",description:"Arrange PDF pages in a custom sequence.",icon:ListPlus,category:"Organize",accent:"blue"},
  {id:"duplicate",name:"Duplicate pages",description:"Copy selected pages into the same PDF.",icon:Files,category:"Organize",accent:"purple"},
  {id:"toimages",name:"PDF to images",description:"Export PDF pages as PNG or JPEG images.",icon:FileImage,category:"Convert",accent:"pink"},
  {id:"blank",name:"Add blank pages",description:"Insert blank pages at the beginning or end.",icon:FileText,category:"Edit",accent:"cyan"},
  {id:"visual",name:"Visual page manager",description:"Preview, reorder and remove pages visually.",icon:FileImage,category:"Organize",accent:"blue"}
];

const iconColors: Record<string,string> = {green:"bg-emerald-50 text-emerald-700",blue:"bg-blue-50 text-blue-700",orange:"bg-orange-50 text-orange-700",purple:"bg-violet-50 text-violet-700",pink:"bg-pink-50 text-pink-700",cyan:"bg-cyan-50 text-cyan-700",amber:"bg-amber-50 text-amber-700",slate:"bg-slate-100 text-slate-700"};

function PageRangeField({value,onChange}:{value:string;onChange:(value:string)=>void}) { return <div><label className="mb-2 block text-sm font-semibold">Page numbers or ranges</label><input value={value} onChange={e=>onChange(e.target.value)} placeholder="Example: 1, 3-5, 8" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"/><p className="mt-2 text-xs text-slate-400">Use commas for pages and hyphens for ranges. Page numbering starts at 1.</p></div> }

export default function Home() {
  const [active, setActive] = useState<ToolId | null>(null);
  const [files, setFiles] = useState<PdfFile[]>([]);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [dragging,setDragging] = useState(false);
  const [query,setQuery] = useState("");
  const [rotation,setRotation] = useState(90);
  const [rotationScope,setRotationScope] = useState<"all"|"selected">("all");
  const [splitMode,setSplitMode] = useState<"ranges"|"chunks">("chunks");
  const [splitRanges,setSplitRanges] = useState("1-3; 4-6");
  const [pagesPerFile,setPagesPerFile] = useState(1);
  const [compressMode,setCompressMode] = useState<"preset"|"target">("preset");
  const [compressLevel,setCompressLevel] = useState<"low"|"medium"|"high">("medium");
  const [targetSizeMb,setTargetSizeMb] = useState(2);
  const [watermarkScope,setWatermarkScope] = useState<"all"|"selected">("all");
  const [protectPassword,setProtectPassword] = useState("");
  const [protectConfirm,setProtectConfirm] = useState("");
  const [dragPageIndex,setDragPageIndex] = useState<number|null>(null);
  const [watermark,setWatermark] = useState("CONFIDENTIAL");
  const [pageRange,setPageRange] = useState("1-2");
  const [pageOrder,setPageOrder] = useState("1, 2, 3");
  const [imageFormat,setImageFormat] = useState<"png"|"jpeg">("png");
  const [blankCount,setBlankCount] = useState(1);
  const [blankPosition,setBlankPosition] = useState<"start"|"end">("end");
  const [pagePreviews,setPagePreviews] = useState<string[]>([]);
  const [visualOrder,setVisualOrder] = useState<number[]>([]);
  const [visualRemove,setVisualRemove] = useState<number[]>([]);
  const [previewLoading,setPreviewLoading] = useState(false);
  const [numberStart,setNumberStart] = useState(1);
  const [metaTitle,setMetaTitle] = useState("");
  const [metaAuthor,setMetaAuthor] = useState("");
  const [metaSubject,setMetaSubject] = useState("");
  const [metaKeywords,setMetaKeywords] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const selectedTool = tools.find(t=>t.id===active);
  const filtered = useMemo(()=>tools.filter(t=>(t.name+" "+t.description+" "+t.category).toLowerCase().includes(query.toLowerCase())),[query]);

  useEffect(()=>{
    if((active!=="visual" && active!=="reorder") || !files[0]) { setPagePreviews([]); setVisualOrder([]); setVisualRemove([]); setPreviewLoading(false); return; }
    let cancelled=false;
    let loadedPdf: {destroy:()=>Promise<void>} | null=null;
    setPreviewLoading(true); setPagePreviews([]); setVisualRemove([]); setMessage("");
    (async()=>{
      const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
      pdfjs.GlobalWorkerOptions.workerSrc="https://unpkg.com/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs";
      const data=new Uint8Array(await files[0].file.arrayBuffer());
      const pdf=await pdfjs.getDocument({data}).promise; loadedPdf=pdf;
      const previews:string[]=[];
      for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++) {
        if(cancelled) break;
        const page=await pdf.getPage(pageNumber); const viewport=page.getViewport({scale:.42});
        const canvas=document.createElement("canvas"); const context=canvas.getContext("2d");
        if(!context) throw new Error("Your browser could not create a page preview.");
        canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
        await page.render({canvasContext:context,viewport}).promise;
        previews.push(canvas.toDataURL("image/jpeg",.76)); page.cleanup();
        if(!cancelled) setPagePreviews([...previews]);
      }
      if(!cancelled) { setVisualOrder(Array.from({length:pdf.numPages},(_,index)=>index)); setPageOrder(Array.from({length:pdf.numPages},(_,index)=>index+1).join(", ")); }
      await pdf.destroy(); loadedPdf=null;
    })().catch(error=>{if(!cancelled)setMessage(error instanceof Error?error.message:"Could not create page previews.");}).finally(()=>{if(!cancelled)setPreviewLoading(false);});
    return ()=>{cancelled=true; if(loadedPdf) void loadedPdf.destroy();};
  },[active,files[0]?.id]);

  function moveVisualPage(index:number,direction:-1|1) {
    setVisualOrder(old=>{const next=[...old]; const target=index+direction; if(target<0||target>=next.length)return old; [next[index],next[target]]=[next[target],next[index]]; return next;});
  }
  function toggleVisualRemove(pageIndex:number) {
    setVisualRemove(old=>old.includes(pageIndex)?old.filter(value=>value!==pageIndex):[...old,pageIndex]);
  }
  function dropVisualPage(targetIndex:number) {
    if(dragPageIndex===null || dragPageIndex===targetIndex) return;
    setVisualOrder(old=>{const next=[...old];const [moved]=next.splice(dragPageIndex,1);next.splice(targetIndex,0,moved);return next;});
    setDragPageIndex(null);
  }
  function moveFile(index:number,direction:-1|1) {
    setFiles(old=>{const next=[...old]; const target=index+direction; if(target<0||target>=next.length)return old; [next[index],next[target]]=[next[target],next[index]]; return next;});
  }
  function parsePageRange(value:string,total:number):number[] {
    const result:number[]=[];
    for(const part of value.split(",").map(v=>v.trim()).filter(Boolean)) {
      const match=part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if(!match) throw new Error("Enter pages like 1, 3-5, 8.");
      const start=Number(match[1]); const end=Number(match[2]||match[1]);
      if(start<1||end<start||end>total) throw new Error("Page range must be between 1 and "+total+".");
      for(let n=start;n<=end;n++) if(!result.includes(n-1)) result.push(n-1);
    }
    if(!result.length) throw new Error("Enter at least one page number.");
    return result;
  }
  function addFiles(list: FileList | File[]) {
    const accepted = Array.from(list).filter(f=>f.type==="application/pdf" || (active==="images" && ["image/png","image/jpeg"].includes(f.type)));
    if (!accepted.length) { setMessage("Choose a supported PDF file" + (active==="images" ? " or image." : ".")); return; }
    setFiles(old=>[...old,...accepted.map(file=>({file,id: crypto.randomUUID()}))]);
    setMessage("");
  }
  function reset() { setFiles([]); setMessage(""); setPagePreviews([]); setVisualOrder([]); setVisualRemove([]); setPageRange("1-2"); setPageOrder("1, 2, 3"); setBlankCount(1); setBlankPosition("end"); setImageFormat("png"); setNumberStart(1); setMetaTitle(""); setMetaAuthor(""); setMetaSubject(""); setMetaKeywords(""); if(inputRef.current) inputRef.current.value=""; if(imageRef.current) imageRef.current.value=""; }
  function download(bytes: Uint8Array, name: string) {
    const blob = new Blob([bytes.slice().buffer as ArrayBuffer],{type:"application/pdf"});
    const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); URL.revokeObjectURL(url);
  }
  function downloadImage(blob: Blob, name: string) {
    const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; a.click(); window.setTimeout(()=>URL.revokeObjectURL(url),1000);
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
        let groups:number[][]=[];
        if(splitMode==="ranges") groups=splitRanges.split(";").map(part=>parsePageRange(part,count));
        else {
          if(pagesPerFile<1||pagesPerFile>count) throw new Error("Pages per file must be between 1 and "+count+".");
          for(let start=0;start<count;start+=pagesPerFile) groups.push(Array.from({length:Math.min(pagesPerFile,count-start)},(_,i)=>start+i));
        }
        for(let i=0;i<groups.length;i++){const output=await PDFDocument.create();(await output.copyPages(source,groups[i])).forEach(page=>output.addPage(page));download(await output.save(),"split-part-"+(i+1)+".pdf");}
        setMessage("Created "+groups.length+" PDF part(s). Your browser may ask to allow multiple downloads.");
      } else if(active==="rotate") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        const indexes=rotationScope==="all"?doc.getPageIndices():parsePageRange(pageRange,doc.getPageCount());
        indexes.forEach(index=>{const page=doc.getPage(index);page.setRotation(degrees((page.getRotation().angle+rotation)%360));});
        download(await doc.save(),"rotated.pdf"); setMessage("Rotated "+(rotationScope==="all"?"all pages":indexes.length+" selected page(s)")+".");
      } else if(active==="compress") {
        const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc="https://unpkg.com/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs";
        const pdf=await pdfjs.getDocument({data:new Uint8Array(await files[0].file.arrayBuffer())}).promise;
        const presets={low:{scale:1.25,quality:.82},medium:{scale:1,quality:.62},high:{scale:.72,quality:.42}};
        const candidates=compressMode==="target"?[{scale:1,quality:.82},{scale:.9,quality:.68},{scale:.8,quality:.55},{scale:.7,quality:.42},{scale:.58,quality:.32}]:[presets[compressLevel]];
        const targetBytes=targetSizeMb*1024*1024;let chosen:Uint8Array|null=null;let chosenSize=Infinity;
        for(const candidate of candidates){const output=await PDFDocument.create();for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);const viewport=page.getViewport({scale:candidate.scale});const canvas=document.createElement("canvas");const context=canvas.getContext("2d");if(!context)throw new Error("Could not create a compression canvas.");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:context,viewport}).promise;const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(v=>v?resolve(v):reject(new Error("Could not compress page "+n)),"image/jpeg",candidate.quality));const image=await output.embedJpg(new Uint8Array(await blob.arrayBuffer()));const outPage=output.addPage([viewport.width,viewport.height]);outPage.drawImage(image,{x:0,y:0,width:viewport.width,height:viewport.height});page.cleanup();}const bytes=await output.save({useObjectStreams:true});if(bytes.length<chosenSize){chosen=bytes;chosenSize=bytes.length;}if(compressMode==="preset"||bytes.length<=targetBytes)break;}
        await pdf.destroy();if(!chosen)throw new Error("Compression did not produce an output file.");download(chosen,"compressed.pdf");setMessage("Output: "+(chosenSize/1024/1024).toFixed(2)+" MB. Pages are rasterized; selectable/searchable text and vectors are not preserved. A target size is best-effort.");
      } else if(active==="watermark") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());const font=await doc.embedFont("Helvetica");
        const indexes=watermarkScope==="all"?doc.getPageIndices():parsePageRange(pageRange,doc.getPageCount());
        indexes.forEach(index=>{const page=doc.getPage(index);const {width,height}=page.getSize();page.drawText(watermark,{x:width*.18,y:height*.48,size:30,font,color:rgb(.72,.72,.72),rotate:degrees(-35),opacity:.35});});
        download(await doc.save(),"watermarked.pdf");setMessage("Watermark added to "+(watermarkScope==="all"?"all pages":indexes.length+" selected page(s)")+".");
      } else if(active==="images") {
        const doc=await PDFDocument.create();
        for(const item of files) {
          const bytes=new Uint8Array(await item.file.arrayBuffer());
          const image=item.file.type==="image/png" ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
          const page=doc.addPage([image.width,image.height]); page.drawImage(image,{x:0,y:0,width:image.width,height:image.height});
        }
        download(await doc.save(),"images.pdf"); setMessage("Your image PDF is ready.");
      } else if(active==="protect") {
        if(protectPassword.length<8)throw new Error("Use a password with at least 8 characters.");if(protectPassword!==protectConfirm)throw new Error("The passwords do not match.");
        const {encryptPDF}=await import("@pdfsmaller/pdf-encrypt");const encrypted=await encryptPDF(new Uint8Array(await files[0].file.arrayBuffer()),protectPassword);
        download(new Uint8Array(encrypted),"protected.pdf");setMessage("Password-protected PDF created using AES-256 encryption.");
      } else if(active==="preview") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer()); setMessage("Document has "+doc.getPageCount()+" pages · "+(files[0].file.size/1024).toFixed(1)+" KB · "+(doc.getTitle()||"No title metadata"));
      } else if(active==="extract") {
        const source=await PDFDocument.load(await files[0].file.arrayBuffer());
        const indexes=parsePageRange(pageRange,source.getPageCount());
        const output=await PDFDocument.create();
        (await output.copyPages(source,indexes)).forEach(page=>output.addPage(page));
        download(await output.save(),"extracted-pages.pdf"); setMessage("Extracted "+indexes.length+" page(s) into a new PDF.");
      } else if(active==="delete") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        const indexes=parsePageRange(pageRange,doc.getPageCount());
        if(indexes.length>=doc.getPageCount()) throw new Error("You cannot delete every page. Keep at least one page.");
        indexes.sort((a,b)=>b-a).forEach(index=>doc.removePage(index));
        download(await doc.save(),"pages-removed.pdf"); setMessage("Removed "+indexes.length+" page(s).");
      } else if(active==="number") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        const font=await doc.embedFont("Helvetica");
        doc.getPages().forEach((page,index)=>{const {width}=page.getSize(); const label=String(numberStart+index); const size=10; const textWidth=font.widthOfTextAtSize(label,size); page.drawText(label,{x:(width-textWidth)/2,y:18,size,font,color:rgb(.35,.4,.37)});});
        download(await doc.save(),"numbered.pdf"); setMessage("Added page numbers to "+doc.getPageCount()+" page(s).");
      } else if(active==="toimages") {
        const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc="https://unpkg.com/pdfjs-dist@4.8.69/legacy/build/pdf.worker.min.mjs";
        const data=new Uint8Array(await files[0].file.arrayBuffer());
        const pdf=await pdfjs.getDocument({data}).promise;
        const totalPages=pdf.numPages;
        for(let pageNumber=1;pageNumber<=totalPages;pageNumber++) {
          const page=await pdf.getPage(pageNumber); const viewport=page.getViewport({scale:1.5});
          const canvas=document.createElement("canvas"); const context=canvas.getContext("2d");
          if(!context) throw new Error("Your browser could not create an image canvas.");
          canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
          await page.render({canvasContext:context,viewport}).promise;
          const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error("Could not export page "+pageNumber+".")),imageFormat==="png"?"image/png":"image/jpeg",.92));
          downloadImage(blob,"page-"+pageNumber+"."+(imageFormat==="png"?"png":"jpg"));
          page.cleanup();
        }
        await pdf.destroy(); setMessage("Exported "+totalPages+" page(s) as "+imageFormat.toUpperCase()+". Your browser may ask to allow multiple downloads.");
      } else if(active==="visual") {
        const source=await PDFDocument.load(await files[0].file.arrayBuffer());
        const keep=visualOrder.filter(index=>!visualRemove.includes(index));
        if(!keep.length) throw new Error("Keep at least one page in the document.");
        const output=await PDFDocument.create();
        (await output.copyPages(source,keep)).forEach(page=>output.addPage(page));
        download(await output.save(),"visually-edited.pdf");
        setMessage("Exported "+keep.length+" page(s) in the displayed order.");
      } else if(active==="blank") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        const first=doc.getPages()[0]; const {width,height}=first.getSize();
        for(let i=0;i<blankCount;i++) {
          if(blankPosition==="start") doc.insertPage(i,[width,height]); else doc.addPage([width,height]);
        }
        download(await doc.save(),"blank-pages-added.pdf"); setMessage("Added "+blankCount+" blank page(s) at the "+blankPosition+".");
      } else if(active==="reorder") {
        const source=await PDFDocument.load(await files[0].file.arrayBuffer());
        const indexes=pagePreviews.length?visualOrder:parsePageRange(pageOrder,source.getPageCount());
        if(indexes.length!==source.getPageCount() || new Set(indexes).size!==source.getPageCount()) throw new Error("List every page exactly once, from 1 to "+source.getPageCount()+".");
        const output=await PDFDocument.create();
        (await output.copyPages(source,indexes)).forEach(page=>output.addPage(page));
        download(await output.save(),"reordered.pdf"); setMessage("Reordered all "+indexes.length+" page(s).");
      } else if(active==="duplicate") {
        const source=await PDFDocument.load(await files[0].file.arrayBuffer());
        const indexes=parsePageRange(pageRange,source.getPageCount());
        const output=await PDFDocument.create();
        (await output.copyPages(source,source.getPageIndices())).forEach(page=>output.addPage(page));
        (await output.copyPages(source,indexes)).forEach(page=>output.addPage(page));
        download(await output.save(),"duplicated-pages.pdf"); setMessage("Added "+indexes.length+" duplicated page(s) to the end of the PDF.");
      } else if(active==="metadata") {
        const doc=await PDFDocument.load(await files[0].file.arrayBuffer());
        if(metaTitle.trim()) doc.setTitle(metaTitle.trim());
        if(metaAuthor.trim()) doc.setAuthor(metaAuthor.trim());
        if(metaSubject.trim()) doc.setSubject(metaSubject.trim());
        if(metaKeywords.trim()) doc.setKeywords(metaKeywords.split(",").map(v=>v.trim()).filter(Boolean));
        doc.setModificationDate(new Date());
        download(await doc.save(),"metadata-updated.pdf"); setMessage("Updated the document metadata.");
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
      <h1 className="mx-auto max-w-3xl font-['Manrope'] text-4xl font-extrabold leading-[1.12] tracking-[-.045em] text-[#172b21] md:text-6xl">FREE + ADS<br/><span className="text-emerald-700">FREE EDITOR</span></h1>
      <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-500 md:text-lg">Useful PDF tools that get straight to the point. Merge, split, rotate and convert documents without complicated steps.</p>
      <div className="mx-auto mt-9 flex max-w-xl flex-col items-center justify-center gap-3 sm:flex-row"><a href="#tools" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#173f2d] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-800 sm:w-auto">Explore PDF tools <ArrowRight size={16}/></a><span className="flex items-center gap-2 text-xs font-semibold text-slate-400"><ShieldCheck size={15} className="text-emerald-600"/> No signup · Browser processing</span></div>
    </section>

    <section id="tools" className="shell pb-20">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-extrabold uppercase tracking-[.2em] text-emerald-700">The toolkit</p><h2 className="font-['Manrope'] text-2xl font-extrabold tracking-tight md:text-3xl">What do you need to do?</h2><p className="mt-2 text-sm text-slate-500">Choose a tool to get started.</p></div><label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-400 focus-within:border-emerald-500"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a PDF tool..." className="w-full bg-transparent text-sm text-slate-800 outline-none sm:w-52"/></label></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filtered.map(tool=>{const Icon=tool.icon;return <button key={tool.id} onClick={()=>{setActive(tool.id);reset();}} className="tool-card rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_4px_18px_rgba(28,55,43,.035)]"><span className={`mb-5 grid h-11 w-11 place-items-center rounded-xl ${iconColors[tool.accent]}`}><Icon size={21}/></span><span className="block font-['Manrope'] text-base font-extrabold">{tool.name}</span><span className="mt-1.5 block min-h-10 text-sm leading-5 text-slate-500">{tool.description}</span><span className="mt-4 flex items-center justify-between text-xs font-bold text-emerald-700"><span>{tool.category}</span><ArrowRight size={15}/></span></button>})}</div>
      {filtered.length===0 && <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-500">No tools match that search.</p>}
    </section>

    <section id="privacy" className="border-y border-emerald-100 bg-[#edf7f0] py-14"><div className="shell grid gap-8 md:grid-cols-3"><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><ShieldCheck/></span><div><h3 className="font-bold">Private by design</h3><p className="mt-1 text-sm leading-6 text-slate-600">Selected PDF operations run locally in your browser. Files are not uploaded to our server.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><Files/></span><div><h3 className="font-bold">Straightforward tools</h3><p className="mt-1 text-sm leading-6 text-slate-600">Focused workflows with clear controls and downloadable results.</p></div></div><div className="flex gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-emerald-700"><Sparkles/></span><div><h3 className="font-bold">Made for everyday use</h3><p className="mt-1 text-sm leading-6 text-slate-600">A clean workspace that works across desktop, tablet and mobile screens.</p></div></div></div></section>

    <footer id="about" className="shell flex flex-col justify-between gap-4 py-8 text-xs text-slate-400 sm:flex-row"><p>© {new Date().getFullYear()} FREE EDITOR. Free browser-based PDF tools.</p><p>Local processing where supported · No account required</p></footer>

    {active && selectedTool && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#10251b]/55 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget){setActive(null);reset();}}}>
      <div className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-extrabold uppercase tracking-[.18em] text-emerald-700">{selectedTool.category} tool</p><h2 className="mt-1 font-['Manrope'] text-2xl font-extrabold">{selectedTool.name}</h2><p className="mt-1 text-sm text-slate-500">{selectedTool.description}</p></div><button aria-label="Close tool" onClick={()=>{setActive(null);reset();}} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><X size={18}/></button></div>
        <div className="p-6">
          <input ref={inputRef} type="file" accept={active==="images"?"image/png,image/jpeg":"application/pdf"} multiple={active==="merge"||active==="images"} className="hidden" onChange={e=>e.target.files&&addFiles(e.target.files)}/>
          <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}} onClick={()=>inputRef.current?.click()} className={`dropzone flex cursor-pointer flex-col items-center rounded-2xl px-5 py-9 text-center ${dragging?"dragging":""}`}><span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700 shadow-sm"><UploadCloud size={24}/></span><span className="font-bold">Drop your {active==="images"?"images":"PDF"} here</span><span className="mt-1 text-xs text-slate-500">or click to browse files</span><span className="mt-4 rounded-lg bg-[#173f2d] px-4 py-2 text-xs font-bold text-white">Choose {active==="images"?"images":"PDF files"}</span></div>
          {files.length>0 && <div className="mt-4 space-y-2">{files.map((item,i)=><div key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3"><FileText size={18} className="shrink-0 text-emerald-700"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.file.name}</p><p className="text-xs text-slate-400">{(item.file.size/1024).toFixed(1)} KB</p></div>{(active==="merge"||active==="images")&&<><span className="text-xs text-slate-400">#{i+1}</span><button aria-label="Move file up" disabled={i===0} onClick={()=>moveFile(i,-1)} className="rounded-md p-1 text-slate-500 hover:bg-white disabled:opacity-30"><ChevronUp size={16}/></button><button aria-label="Move file down" disabled={i===files.length-1} onClick={()=>moveFile(i,1)} className="rounded-md p-1 text-slate-500 hover:bg-white disabled:opacity-30"><ChevronDown size={16}/></button></>}<button aria-label="Remove file" onClick={()=>setFiles(old=>old.filter(f=>f.id!==item.id))} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-red-600"><Trash2 size={15}/></button></div>)}</div>}
          {active==="split"&&<div className="mt-5 space-y-4"><div><label className="mb-2 block text-sm font-semibold">Split method</label><div className="grid grid-cols-2 gap-2">{([{value:"chunks",label:"Pages per file"},{value:"ranges",label:"Custom ranges"}] as const).map(option=><button key={option.value} onClick={()=>setSplitMode(option.value)} className={`rounded-xl border py-2 text-sm font-bold ${splitMode===option.value?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{option.label}</button>)}</div></div>{splitMode==="chunks"?<label className="block text-sm font-semibold">Pages in each output PDF<input type="number" min="1" value={pagesPerFile} onChange={e=>setPagesPerFile(Math.max(1,Number(e.target.value)||1))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label>:<label className="block text-sm font-semibold">Page ranges (separate groups with semicolons)<input value={splitRanges} onChange={e=>setSplitRanges(e.target.value)} placeholder="1-3; 4-6; 7-9" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/><span className="mt-1 block text-xs font-normal text-slate-400">Example: 1-3; 4-6 creates two PDF files.</span></label>}</div>}
          {active==="compress"&&<div className="mt-5 space-y-4"><div><label className="mb-2 block text-sm font-semibold">Compression method</label><div className="grid grid-cols-2 gap-2">{([{value:"preset",label:"Compression level"},{value:"target",label:"Target file size"}] as const).map(option=><button key={option.value} onClick={()=>setCompressMode(option.value)} className={`rounded-xl border py-2 text-sm font-bold ${compressMode===option.value?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{option.label}</button>)}</div></div>{compressMode==="preset"?<div><label className="mb-2 block text-sm font-semibold">Compression level</label><div className="grid grid-cols-3 gap-2">{(["low","medium","high"] as const).map(level=><button key={level} onClick={()=>setCompressLevel(level)} className={`rounded-xl border py-2 text-sm font-bold capitalize ${compressLevel===level?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{level}</button>)}</div></div>:<label className="block text-sm font-semibold">Target size (MB)<input type="number" min=".1" step=".1" value={targetSizeMb} onChange={e=>setTargetSizeMb(Math.max(.1,Number(e.target.value)||.1))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label>}<p className="text-xs text-amber-700">This compression method rasterizes pages into JPEG images. Searchable text and vector content are not retained. Target size is best-effort.</p></div>}
          {active==="protect"&&<div className="mt-5 space-y-3"><label className="block text-sm font-semibold">Open password<input type="password" autoComplete="new-password" value={protectPassword} onChange={e=>setProtectPassword(e.target.value)} minLength={8} placeholder="At least 8 characters" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><label className="block text-sm font-semibold">Confirm password<input type="password" autoComplete="new-password" value={protectConfirm} onChange={e=>setProtectConfirm(e.target.value)} placeholder="Enter the same password again" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"/></label><p className="text-xs text-slate-500">AES-256 encryption runs in your browser. Keep the password safe; it cannot be recovered if lost.</p></div>}
          {active==="rotate"&&<div className="mt-5 space-y-4"><div><label className="mb-2 block text-sm font-semibold">Apply rotation to</label><div className="grid grid-cols-2 gap-2">{(["all","selected"] as const).map(scope=><button key={scope} onClick={()=>setRotationScope(scope)} className={`rounded-xl border py-2 text-sm font-bold capitalize ${rotationScope===scope?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{scope==="all"?"Whole PDF":"Selected pages"}</button>)}</div></div><div><label className="mb-2 block text-sm font-semibold">Rotation angle</label><div className="grid grid-cols-3 gap-2">{[90,180,270].map(n=><button key={n} onClick={()=>setRotation(n)} className={`rounded-xl border py-2 text-sm font-bold ${rotation===n?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{n}°</button>)}</div></div>{rotationScope==="selected"&&<PageRangeField value={pageRange} onChange={setPageRange} />}</div>}
          {(active==="extract"||active==="delete"||active==="duplicate")&&<div className="mt-5"><label className="mb-2 block text-sm font-semibold">Page numbers or ranges</label><input value={pageRange} onChange={e=>setPageRange(e.target.value)} placeholder="Example: 1, 3-5, 8" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"/><p className="mt-2 text-xs text-slate-400">Use commas for separate pages and hyphens for ranges. Pages start at 1.</p></div>}
          {active==="visual"&&<div className="mt-5"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold">Page layout</p><p className="text-xs text-slate-500">{visualOrder.length} pages · {visualRemove.length} marked for removal</p></div>{previewLoading&&<p className="mb-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Generating page thumbnails…</p>}{pagePreviews.length>0&&<div className="grid max-h-[360px] grid-cols-2 gap-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">{visualOrder.map((originalIndex,position)=><div key={originalIndex} draggable onDragStart={()=>setDragPageIndex(position)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropVisualPage(position)} className={`cursor-grab rounded-xl border bg-white p-2 ${visualRemove.includes(originalIndex)?"border-red-300 opacity-50":"border-slate-200"}`}><div className="mb-2 flex items-center justify-between gap-1"><span className="text-xs font-bold text-slate-600">Position {position+1}</span><label className="flex items-center gap-1 text-[11px] font-semibold text-red-700"><input type="checkbox" checked={visualRemove.includes(originalIndex)} onChange={()=>toggleVisualRemove(originalIndex)}/> Remove</label></div><img src={pagePreviews[originalIndex]} alt={"Preview of original page "+(originalIndex+1)} className="mx-auto max-h-40 w-auto border border-slate-100 object-contain"/><p className="mt-2 text-center text-[11px] text-slate-500">Original page {originalIndex+1}</p><div className="mt-2 flex justify-center gap-2"><button aria-label="Move page earlier" disabled={position===0} onClick={()=>moveVisualPage(position,-1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 disabled:opacity-30"><ChevronUp size={15}/></button><button aria-label="Move page later" disabled={position===visualOrder.length-1} onClick={()=>moveVisualPage(position,1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 disabled:opacity-30"><ChevronDown size={15}/></button></div></div>)}</div>}{!previewLoading&&pagePreviews.length===0&&!message&&<p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Upload a PDF to see page previews.</p>}<p className="mt-2 text-xs text-slate-400">Use the arrows to change page order. Mark pages for removal, then export the remaining pages.</p></div>}
          {active==="toimages"&&<div className="mt-5"><label className="mb-2 block text-sm font-semibold">Image format</label><div className="grid grid-cols-2 gap-2">{(["png","jpeg"] as const).map(format=><button key={format} onClick={()=>setImageFormat(format)} className={`rounded-xl border py-2.5 text-sm font-bold ${imageFormat===format?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{format.toUpperCase()}</button>)}</div><p className="mt-2 text-xs text-slate-400">Each page is rendered locally at 1.5× scale and downloaded as a separate image.</p></div>}
          {active==="blank"&&<div className="mt-5 space-y-4"><label className="block text-sm font-semibold">Number of blank pages<input type="number" min="1" max="20" value={blankCount} onChange={e=>setBlankCount(Math.min(20,Math.max(1,Number(e.target.value)||1)))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-emerald-600"/></label><div><label className="mb-2 block text-sm font-semibold">Insert position</label><div className="grid grid-cols-2 gap-2">{(["start","end"] as const).map(position=><button key={position} onClick={()=>setBlankPosition(position)} className={`rounded-xl border py-2.5 text-sm font-bold capitalize ${blankPosition===position?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{position}</button>)}</div></div><p className="text-xs text-slate-400">Blank pages use the size of the first page in the document.</p></div>}
          {active==="reorder"&&<div className="mt-5"><label className="mb-2 block text-sm font-semibold">Visual page order</label>{previewLoading&&<p className="rounded-xl bg-blue-50 p-3 text-sm text-blue-800">Creating page previews…</p>}{pagePreviews.length>0?<div className="grid max-h-[380px] grid-cols-2 gap-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">{visualOrder.map((originalIndex,position)=><div key={originalIndex} draggable onDragStart={()=>setDragPageIndex(position)} onDragOver={e=>e.preventDefault()} onDrop={()=>dropVisualPage(position)} className="cursor-grab rounded-xl border border-slate-200 bg-white p-2"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold">Position {position+1}</span><span className="text-[10px] text-slate-400">Drag to move</span></div><img src={pagePreviews[originalIndex]} alt={"Page "+(originalIndex+1)} className="mx-auto max-h-40 border object-contain"/><p className="mt-2 text-center text-xs text-slate-500">Original page {originalIndex+1}</p><div className="mt-2 flex justify-center gap-2"><button aria-label="Move page up" disabled={position===0} onClick={()=>moveVisualPage(position,-1)} className="rounded-lg border p-1.5 disabled:opacity-30"><ChevronUp size={15}/></button><button aria-label="Move page down" disabled={position===visualOrder.length-1} onClick={()=>moveVisualPage(position,1)} className="rounded-lg border p-1.5 disabled:opacity-30"><ChevronDown size={15}/></button></div></div>)}</div>:<><input value={pageOrder} onChange={e=>setPageOrder(e.target.value)} placeholder="Example: 3, 1, 2, 4" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"/><p className="mt-2 text-xs text-slate-400">Upload a PDF to see thumbnails, then drag pages or use arrows.</p></>}</div>}
          {active==="number"&&<div className="mt-5"><label className="mb-2 block text-sm font-semibold">Starting page number</label><input type="number" min="1" max="999999" value={numberStart} onChange={e=>setNumberStart(Math.max(1,Number(e.target.value)||1))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"/><p className="mt-2 text-xs text-slate-400">Numbers are placed at the bottom center of each page.</p></div>}
          {active==="metadata"&&<div className="mt-5 grid gap-3"><label className="text-sm font-semibold">Document title<input value={metaTitle} onChange={e=>setMetaTitle(e.target.value)} placeholder="Title" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"/></label><label className="text-sm font-semibold">Author<input value={metaAuthor} onChange={e=>setMetaAuthor(e.target.value)} placeholder="Author name" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"/></label><label className="text-sm font-semibold">Subject<input value={metaSubject} onChange={e=>setMetaSubject(e.target.value)} placeholder="Document subject" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"/></label><label className="text-sm font-semibold">Keywords<input value={metaKeywords} onChange={e=>setMetaKeywords(e.target.value)} placeholder="comma, separated, keywords" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600"/></label><p className="text-xs text-slate-400">Leave a field blank to keep its existing value.</p></div>}
          {active==="watermark"&&<div className="mt-5 space-y-4"><div><label className="mb-2 block text-sm font-semibold">Watermark text</label><input value={watermark} onChange={e=>setWatermark(e.target.value)} maxLength={40} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"/></div><div><label className="mb-2 block text-sm font-semibold">Apply watermark to</label><div className="grid grid-cols-2 gap-2">{(["all","selected"] as const).map(scope=><button key={scope} onClick={()=>setWatermarkScope(scope)} className={`rounded-xl border py-2 text-sm font-bold capitalize ${watermarkScope===scope?"border-emerald-600 bg-emerald-50 text-emerald-800":"border-slate-200 text-slate-600"}`}>{scope==="all"?"All pages":"Selected pages"}</button>)}</div></div>{watermarkScope==="selected"&&<PageRangeField value={pageRange} onChange={setPageRange}/>}</div>}
          {message && <p className={`mt-4 rounded-xl p-3 text-sm ${message.includes("ready")||message.includes("Downloaded")||message.includes("pages")?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}>{message}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between"><button onClick={reset} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Clear files</button><button disabled={!files.length||busy||(active==="merge"&&files.length<2)||((active==="extract"||active==="delete"||active==="duplicate")&&!pageRange.trim())||(active==="reorder"&&!pageOrder.trim())||(active==="blank"&&(blankCount<1||blankCount>20))||(active==="visual"&&(previewLoading||!visualOrder.length||visualOrder.every(index=>visualRemove.includes(index))))||(active==="watermark"&&!watermark.trim())||(active==="number"&&numberStart<1)} onClick={runTool} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#173f2d] px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">{busy?"Processing…":active==="preview"?"Inspect PDF":active==="toimages"?"Convert to images":active==="visual"?"Export arranged PDF":"Process and download"} <Download size={16}/></button></div>
          <p className="mt-4 flex items-center justify-center gap-2 text-center text-[11px] text-slate-400"><ShieldCheck size={13}/> Files are processed in this browser tab.</p>
        </div>
      </div>
    </div>}
  </main>;
}