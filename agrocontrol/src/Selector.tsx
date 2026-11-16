import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

/* Desplegable propio para los formularios: no se puede escribir, se hace clic y
   se elige. A diferencia del autocompletado del navegador, la lista siempre
   muestra todas las opciones, aunque ya haya una elegida. */
export default function Selector({ etiqueta, valor, opciones, placeholder = 'Elegí una opción', onCambio }: {
  etiqueta: string
  valor: string
  opciones: string[]
  placeholder?: string
  onCambio: (v: string) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const [activa, setActiva] = useState(0)
  const caja = useRef<HTMLDivElement>(null)
  const id = useId()

  // Se cierra al hacer clic afuera
  useEffect(() => {
    if (!abierto) return
    const afuera = (e: MouseEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', afuera)
    return () => document.removeEventListener('mousedown', afuera)
  }, [abierto])

  const abrir = () => {
    setActiva(Math.max(0, opciones.indexOf(valor)))
    setAbierto(true)
  }

  const elegir = (o: string) => {
    onCambio(o)
    setAbierto(false)
  }

  const teclado = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!abierto) return abrir()
      const paso = e.key === 'ArrowDown' ? 1 : -1
      setActiva((a) => (a + paso + opciones.length) % opciones.length)
    } else if (abierto && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      elegir(opciones[activa])
    } else if (abierto && e.key === 'Escape') {
      e.stopPropagation() // cierra solo la lista, no el formulario
      setAbierto(false)
    } else if (abierto && e.key === 'Tab') {
      setAbierto(false)
    }
  }

  return (
    <div className={abierto ? 'campo-select abierto' : 'campo-select'} ref={caja}>
      <span className="campo-select-etiqueta" id={`${id}-etiqueta`}>{etiqueta}</span>
      <button
        type="button"
        className={valor ? 'campo-select-boton' : 'campo-select-boton vacio'}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-labelledby={`${id}-etiqueta`}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={teclado}
      >
        <span>{valor || placeholder}</span>
        <span className="campo-select-flecha" aria-hidden="true" />
      </button>

      {abierto && (
        <ul className="campo-select-lista" role="listbox" aria-labelledby={`${id}-etiqueta`}>
          {opciones.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={o === valor}
              className={i === activa ? 'campo-select-opcion resaltada' : 'campo-select-opcion'}
              onMouseEnter={() => setActiva(i)}
              onClick={() => elegir(o)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
