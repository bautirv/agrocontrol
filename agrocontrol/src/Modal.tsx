import { useEffect, type ReactNode } from 'react'

/* ---------- Caja modal (para los formularios) ---------- */
export default function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', tecla)
    return () => document.removeEventListener('keydown', tecla)
  }, [onCerrar])

  return (
    <div
      className="modal-fondo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar()
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <button type="button" className="modal-x" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>
        {children}
      </div>
    </div>
  )
}
