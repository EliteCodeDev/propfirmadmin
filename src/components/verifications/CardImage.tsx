"use client";

import { useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type CardImageProps = {
    selectedImage: string | null;
    onClose: () => void;
    title?: string;
};

export default function CardImage({ selectedImage, onClose}: CardImageProps) {
    const imgContainerRef = useRef<HTMLDivElement | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStart = useRef<{ x: number; y: number } | null>(null);
    const lastTapRef = useRef<number>(0);
    const touchStartRef = useRef<{ x: number; y: number } | null>(null);
    const pinchStartDistRef = useRef<number | null>(null);
    const pinchStartZoomRef = useRef<number>(1);

    const distance = (t1: { clientX: number; clientY: number }, t2: { clientX: number; clientY: number }) => {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.hypot(dx, dy);
    };

    const resetZoom = () => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setIsPanning(false);
    };

    const onWheelZoom: React.WheelEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        const delta = -e.deltaY;
        const factor = delta > 0 ? 1.1 : 0.9;
        setZoom((z) => Math.min(6, Math.max(0.5, z * factor)));
    };

    const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
        setIsPanning(true);
        panStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    };
    const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (!isPanning || !panStart.current) return;
        setOffset({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
    };
    const onMouseUp: React.MouseEventHandler<HTMLDivElement> = () => setIsPanning(false);
    const onMouseLeave: React.MouseEventHandler<HTMLDivElement> = () => setIsPanning(false);
    const onDoubleClick: React.MouseEventHandler<HTMLDivElement> = () => {
        setZoom((z) => (z > 1 ? 1 : 2));
        if (zoom <= 1) setOffset({ x: 0, y: 0 });
    };

    const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
        if (e.touches.length === 2) {
            pinchStartDistRef.current = distance(e.touches[0], e.touches[1]);
            pinchStartZoomRef.current = zoom;
            touchStartRef.current = null; // disable pan while pinching
            return;
        }
        const now = Date.now();
        const dt = now - (lastTapRef.current || 0);
        if (dt < 300) {
            setZoom((z) => (z > 1 ? 1 : 2));
            if (zoom <= 1) setOffset({ x: 0, y: 0 });
        }
        lastTapRef.current = now;
        const t = e.touches[0];
        touchStartRef.current = { x: t.clientX - offset.x, y: t.clientY - offset.y };
    };
    const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
        if (e.touches.length === 2 && pinchStartDistRef.current) {
            const dist = distance(e.touches[0], e.touches[1]);
            const scale = dist / pinchStartDistRef.current;
            const next = Math.min(6, Math.max(0.5, pinchStartZoomRef.current * scale));
            setZoom(next);
            return;
        }
        if (!touchStartRef.current) return;
        const t = e.touches[0];
        setOffset({ x: t.clientX - touchStartRef.current.x, y: t.clientY - touchStartRef.current.y });
    };
    const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
        if (e.touches.length < 2) pinchStartDistRef.current = null;
        if (e.touches.length === 0) touchStartRef.current = null;
    };

    const zoomIn = () => setZoom((z) => Math.min(6, z * 1.25));
    const zoomOut = () => setZoom((z) => Math.max(0.5, z * 0.8));

    return (
        <Dialog
            open={!!selectedImage}
            onOpenChange={(open) => {
                if (!open) {
                    onClose();
                    resetZoom();
                }
            }}
        >
            <DialogContent className="max-w-5xl max-h-[92vh] p-2">
                <div className="flex items-center justify-between gap-2 px-2 pb-2">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={zoomOut} aria-label="Alejar">-</Button>
                        <div className="text-sm w-16 text-center select-none">{Math.round(zoom * 100)}%</div>
                        <Button variant="outline" size="sm" onClick={zoomIn} aria-label="Acercar">+</Button>
                        <Button variant="ghost" size="sm" onClick={resetZoom}>Restablecer</Button>
                    </div>
                    <div>
                        <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
                    </div>
                </div>
                <div
                    ref={imgContainerRef}
                    className={`relative w-full h-[70vh] bg-black/5 dark:bg-white/5 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onWheel={onWheelZoom}
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseLeave}
                    onDoubleClick={onDoubleClick}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    {selectedImage && (
                        <div
                            className="absolute top-1/2 left-1/2"
                            style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }}
                        >
                            <div className="relative w-[80vw] max-w-[1200px] h-[60vh]">
                                <Image
                                    src={selectedImage}
                                    alt="Documento ampliado"
                                    fill
                                    className="object-contain select-none"
                                    draggable={false}
                                    priority
                                />
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}