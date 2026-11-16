import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import Selector from './Selector'
import type { CambiosUsuario, Usuario } from './servicios'
import { type Aplicacion, type Campo, type Cosecha, type Labor, type Lote, type Orden, type Producto, type Riego } from './datos'

/* Formularios de alta. Cada uno valida las mismas reglas que el backend
   (ver schemas/*.py) y devuelve solo los datos que carga la persona: el campo,
   el lote, el usuario y el id los agrega la pantalla que lo usa. */

const hoy = () => new Date().toISOString().slice(0, 10)
const num = (s: string) => Number(s.replace(',', '.'))
const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function Entrada({ etiqueta, ...props }: { etiqueta: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label>
      {etiqueta}
      <input {...props} />
    </label>
  )
}

function Observaciones({ valor, onCambio }: { valor: string; onCambio: (v: string) => void }) {
  return (
    <label>
      Observaciones (opcional)
      <textarea rows={2} maxLength={2000} value={valor} onChange={(e) => onCambio(e.target.value)} />
    </label>
  )
}

const textoGuardar = (inicial: unknown, normal: string) => (inicial ? 'Guardar cambios' : normal)

function Encabezado({ etiqueta, titulo }: { etiqueta: string; titulo: string }) {
  return (
    <>
      <p className="etiqueta">{etiqueta}</p>
      <h3 className="modal-titulo">{titulo}</h3>
    </>
  )
}

export function Pie({ error, enviando, texto }: { error: string; enviando: boolean; texto: string }) {
  return (
    <>
      {error && <p className="campo-error">{error}</p>}
      <button type="submit" className="campo-guardar" disabled={enviando}>
        {enviando ? 'Guardando…' : texto}
      </button>
    </>
  )
}

// Cada formulario puede guardar contra la API: si falla, el error se muestra y el formulario queda abierto
export function useEnvio() {
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const intentar = async (accion: () => void | Promise<void>) => {
    setError('')
    setEnviando(true)
    try {
      await accion()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    } finally {
      setEnviando(false)
    }
  }

  return { error, setError, enviando, intentar }
}

/* ---------- Campo (dentro de una campaña) ---------- */
export type NuevoCampo = Pick<Campo, 'nombre' | 'ubicacion' | 'superficie_total'>

export function FormCampo({ campania, existentes, inicial, onGuardar }: {
  campania: string
  inicial?: Campo // si viene, el formulario edita en lugar de crear
  existentes: string[] // nombres de todos los campos: en el backend el nombre no se puede repetir
  onGuardar: (c: NuevoCampo) => void | Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [ubicacion, setUbicacion] = useState(inicial?.ubicacion ?? '')
  const [superficie, setSuperficie] = useState(inicial ? String(inicial.superficie_total) : '')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('Ingresá el nombre del campo.')
    if (existentes.some((n) => igual(n, nombre))) return setError('Ya existe un campo con ese nombre.')
    if (!ubicacion.trim()) return setError('Ingresá la ubicación.')
    if (!(num(superficie) > 0)) return setError('La superficie debe ser mayor a 0.')
    void intentar(() => onGuardar({ nombre: nombre.trim(), ubicacion: ubicacion.trim(), superficie_total: num(superficie) }))
  }

  return (
    <>
      <Encabezado etiqueta={`${inicial ? 'Editar' : 'Nuevo'} · ${campania}`} titulo={inicial ? 'Editar campo' : 'Agregar campo'} />
      <form className="campo-form" onSubmit={enviar}>
        <Entrada etiqueta="Nombre" type="text" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="La Esperanza" />
        <div className="campo-fila">
          <Entrada etiqueta="Ubicación" type="text" maxLength={200} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Tres Arroyos" />
          <Entrada etiqueta="Superficie (ha)" type="number" min="0" step="any" value={superficie} onChange={(e) => setSuperficie(e.target.value)} />
        </div>
        <Pie error={error} enviando={enviando} texto={textoGuardar(inicial, 'Guardar campo')} />
      </form>
    </>
  )
}

/* ---------- Lote (dentro de un campo) ---------- */
export type NuevoLote = Pick<Lote, 'nombre' | 'superficie' | 'variedad' | 'fecha_siembra' | 'cantidad_semilla'>

export function FormLote({ campo, existentes, inicial, onGuardar }: {
  campo: string
  inicial?: Lote
  existentes: string[] // lotes de este campo
  onGuardar: (l: NuevoLote) => void | Promise<void>
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [superficie, setSuperficie] = useState(inicial ? String(inicial.superficie) : '')
  const [variedad, setVariedad] = useState(inicial?.variedad ?? '')
  const [siembra, setSiembra] = useState(inicial?.fecha_siembra ?? '')
  const [semilla, setSemilla] = useState(inicial ? String(inicial.cantidad_semilla) : '')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('Ingresá el nombre del lote.')
    if (existentes.some((n) => igual(n, nombre))) return setError('Ya existe un lote con ese nombre en este campo.')
    if (!(num(superficie) > 0)) return setError('La superficie debe ser mayor a 0.')
    if (!variedad.trim()) return setError('Ingresá la variedad.')
    if (!(num(semilla) > 0)) return setError('La cantidad de semilla debe ser mayor a 0.')
    void intentar(() =>
      onGuardar({
        nombre: nombre.trim(),
        superficie: num(superficie),
        variedad: variedad.trim(),
        fecha_siembra: siembra,
        cantidad_semilla: num(semilla),
      }),
    )
  }

  return (
    <>
      <Encabezado etiqueta={`${inicial ? 'Editar' : 'Nuevo'} · ${campo}`} titulo={inicial ? 'Editar lote' : 'Agregar lote'} />
      <form className="campo-form" onSubmit={enviar}>
        <div className="campo-fila">
          <Entrada etiqueta="Nombre" type="text" maxLength={50} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Lote 3" />
          <Entrada etiqueta="Superficie (ha)" type="number" min="0" step="any" value={superficie} onChange={(e) => setSuperficie(e.target.value)} />
        </div>
        <Entrada etiqueta="Variedad" type="text" maxLength={100} value={variedad} onChange={(e) => setVariedad(e.target.value)} placeholder="DM 4612" />
        <div className="campo-fila">
          <Entrada etiqueta="Siembra (opcional)" type="date" value={siembra} onChange={(e) => setSiembra(e.target.value)} />
          <Entrada etiqueta="Semilla (kg)" type="number" min="0" step="any" value={semilla} onChange={(e) => setSemilla(e.target.value)} />
        </div>
        <Pie error={error} enviando={enviando} texto={textoGuardar(inicial, 'Guardar lote')} />
      </form>
    </>
  )
}

/* ---------- Labor ---------- */
const TIPOS_LABOR = [
  'Disco y rastra',
  'Cincel y rastra',
  'Frezadora',
  'Siembra - Fertil. 450Kg DAP',
  'Conformador',
]

export type NuevaLabor = Pick<Labor, 'tipo' | 'fecha' | 'observaciones'>

export function FormLabor({ lote, inicial, onGuardar }: { lote: string; inicial?: Labor; onGuardar: (l: NuevaLabor) => void | Promise<void> }) {
  const [tipo, setTipo] = useState(inicial?.tipo ?? '')
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy())
  const [obs, setObs] = useState(inicial?.observaciones ?? '')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!tipo) return setError('Elegí el tipo de labor.')
    if (!fecha) return setError('Elegí la fecha.')
    void intentar(() => onGuardar({ tipo, fecha, observaciones: obs.trim() }))
  }

  return (
    <>
      <Encabezado etiqueta={`${inicial ? 'Editar' : 'Nueva'} · ${lote}`} titulo={inicial ? 'Editar labor' : 'Agregar labor'} />
      <form className="campo-form" onSubmit={enviar}>
        <Selector etiqueta="Tipo de labor" valor={tipo} opciones={TIPOS_LABOR} placeholder="Elegí la labor" onCambio={setTipo} />
        <Entrada etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Observaciones valor={obs} onCambio={setObs} />
        <Pie error={error} enviando={enviando} texto={textoGuardar(inicial, 'Guardar labor')} />
      </form>
    </>
  )
}

/* ---------- Riego ---------- */
export type NuevoRiego = Pick<Riego, 'fecha' | 'hora_inicio' | 'hora_fin' | 'cantidad_agua' | 'observaciones'>

export function FormRiego({ lote, inicial, onGuardar }: { lote: string; inicial?: Riego; onGuardar: (r: NuevoRiego) => void | Promise<void> }) {
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoy())
  const [inicio, setInicio] = useState(inicial?.hora_inicio ?? '')
  const [fin, setFin] = useState(inicial?.hora_fin ?? '')
  const [agua, setAgua] = useState(inicial ? String(inicial.cantidad_agua) : '')
  const [obs, setObs] = useState(inicial?.observaciones ?? '')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!fecha) return setError('Elegí la fecha.')
    if (!inicio || !fin) return setError('Ingresá la hora de inicio y la de fin.')
    if (fin <= inicio) return setError('La hora de fin debe ser posterior a la de inicio.')
    if (!(num(agua) > 0)) return setError('La cantidad de agua debe ser mayor a 0.')
    void intentar(() => onGuardar({ fecha, hora_inicio: inicio, hora_fin: fin, cantidad_agua: num(agua), observaciones: obs.trim() }))
  }

  return (
    <>
      <Encabezado etiqueta={`${inicial ? 'Editar' : 'Nuevo'} · ${lote}`} titulo={inicial ? 'Editar riego' : 'Agregar riego'} />
      <form className="campo-form" onSubmit={enviar}>
        <div className="campo-fila">
          <Entrada etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <Entrada etiqueta="Cantidad de agua" type="number" min="0" step="any" value={agua} onChange={(e) => setAgua(e.target.value)} />
        </div>
        <div className="campo-fila">
          <Entrada etiqueta="Hora de inicio" type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          <Entrada etiqueta="Hora de fin" type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
        </div>
        <Observaciones valor={obs} onCambio={setObs} />
        <Pie error={error} enviando={enviando} texto={textoGuardar(inicial, 'Guardar riego')} />
      </form>
    </>
  )
}

/* ---------- Cosecha (con camiones opcionales) ---------- */
export type NuevaCosecha = Pick<Cosecha, 'fecha' | 'dtve' | 'cantidad_cosechada' | 'observaciones'> & {
  camiones: { patente: string; cantidad_transportada: number; destino: string }[]
}

type FilaCamion = { patente: string; cantidad: string; destino: string }

export function FormCosecha({ lote, onGuardar }: { lote: string; onGuardar: (c: NuevaCosecha) => void | Promise<void> }) {
  const [fecha, setFecha] = useState(hoy())
  const [dtve, setDtve] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [camiones, setCamiones] = useState<FilaCamion[]>([])
  const [obs, setObs] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  const cambiar = (i: number, campo: keyof FilaCamion, valor: string) =>
    setCamiones((prev) => prev.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!fecha) return setError('Elegí la fecha.')
    if (!dtve.trim()) return setError('El DTV-e es obligatorio.')
    if (!(num(cantidad) > 0)) return setError('La cantidad cosechada debe ser mayor a 0.')
    for (const c of camiones) {
      if (!c.patente.trim() || !c.destino.trim()) return setError('Completá la patente y el destino de cada camión.')
      if (!(num(c.cantidad) > 0)) return setError('La cantidad de cada camión debe ser mayor a 0.')
    }
    const transportado = camiones.reduce((s, c) => s + num(c.cantidad), 0)
    if (transportado > num(cantidad)) return setError('Los camiones transportan más de lo cosechado.')
    void intentar(() => onGuardar({ fecha, dtve: dtve.trim(), cantidad_cosechada: num(cantidad), camiones: camiones.map((c) => ({ patente: c.patente.trim(), cantidad_transportada: num(c.cantidad), destino: c.destino.trim() })), observaciones: obs.trim() }))
  }

  return (
    <>
      <Encabezado etiqueta={`Nueva · ${lote}`} titulo="Agregar cosecha" />
      <form className="campo-form" onSubmit={enviar}>
        <div className="campo-fila">
          <Entrada etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <Entrada etiqueta="Cantidad cosechada" type="number" min="0" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        </div>
        <Entrada etiqueta="DTV-e" type="text" maxLength={50} value={dtve} onChange={(e) => setDtve(e.target.value)} placeholder="DTVE-0002" />

        <div className="filas-extra">
          <p className="filas-titulo">Camiones (opcional)</p>
          {camiones.map((c, i) => (
            <div className="fila-camion" key={i}>
              <Entrada etiqueta="Patente" type="text" maxLength={10} value={c.patente} onChange={(e) => cambiar(i, 'patente', e.target.value.toUpperCase())} />
              <Entrada etiqueta="Cantidad" type="number" min="0" step="any" value={c.cantidad} onChange={(e) => cambiar(i, 'cantidad', e.target.value)} />
              <Entrada etiqueta="Destino" type="text" maxLength={150} value={c.destino} onChange={(e) => cambiar(i, 'destino', e.target.value)} />
              <button type="button" className="fila-quitar" aria-label="Quitar camión" onClick={() => setCamiones((p) => p.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button type="button" className="link-agregar" onClick={() => setCamiones((p) => [...p, { patente: '', cantidad: '', destino: '' }])}>
            + Agregar camión
          </button>
        </div>

        <Observaciones valor={obs} onCambio={setObs} />
        <Pie error={error} enviando={enviando} texto="Guardar cosecha" />
      </form>
    </>
  )
}

/* ---------- Orden de aplicación (la emite un administrador) ---------- */
export type NuevaOrden = Pick<Orden, 'fecha' | 'objetivo' | 'observaciones'>

export function FormOrden({ lote, onGuardar }: { lote: string; onGuardar: (o: NuevaOrden) => void | Promise<void> }) {
  const [fecha, setFecha] = useState(hoy())
  const [objetivo, setObjetivo] = useState('')
  const [obs, setObs] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!fecha) return setError('Elegí la fecha.')
    if (!objetivo.trim()) return setError('Ingresá el objetivo de la orden.')
    void intentar(() => onGuardar({ fecha, objetivo: objetivo.trim(), observaciones: obs.trim() }))
  }

  return (
    <>
      <Encabezado etiqueta={`Nueva · ${lote}`} titulo="Nueva orden de aplicación" />
      <form className="campo-form" onSubmit={enviar}>
        <Entrada etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Entrada etiqueta="Objetivo" type="text" maxLength={200} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Control de malezas" />
        <Observaciones valor={obs} onCambio={setObs} />
        <Pie error={error} enviando={enviando} texto="Guardar orden" />
      </form>
    </>
  )
}

/* ---------- Aplicación (se carga sobre una orden pendiente) ---------- */
export type NuevaAplicacion = Pick<Aplicacion, 'fecha' | 'temperatura' | 'humedad' | 'viento' | 'productos' | 'observaciones'> & {
  id_orden_aplicacion: number
  consumo: { producto: string; cantidad: number }[] // para descontar del stock
}

type FilaProducto = { producto: string; cantidad: string }

export function FormAplicacion({ lote, ordenes, catalogo, onGuardar }: {
  lote: string
  ordenes: Orden[] // solo las PENDIENTES de este lote
  catalogo: Producto[] // productos con su stock actual
  onGuardar: (a: NuevaAplicacion) => void | Promise<void>
}) {
  const [orden, setOrden] = useState(ordenes[0]?.id_orden_aplicacion ?? 0)
  const [fecha, setFecha] = useState(hoy())
  const [temp, setTemp] = useState('')
  const [humedad, setHumedad] = useState('')
  const [viento, setViento] = useState('')
  const [productos, setProductos] = useState<FilaProducto[]>([{ producto: catalogo[0]?.nombre_comercial ?? '', cantidad: '' }])
  const [obs, setObs] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  if (ordenes.length === 0) {
    return (
      <>
        <Encabezado etiqueta={`Nueva · ${lote}`} titulo="Agregar aplicación" />
        <p className="aviso">
          Este lote no tiene órdenes de aplicación pendientes. Una aplicación se carga sobre una orden:
          pedile a un administrador que cree una.
        </p>
      </>
    )
  }

  if (catalogo.length === 0) {
    return (
      <>
        <Encabezado etiqueta={`Nueva · ${lote}`} titulo="Agregar aplicación" />
        <p className="aviso">No hay productos cargados. Un administrador tiene que agregarlos primero en Stock de productos.</p>
      </>
    )
  }

  const cambiar = (i: number, campo: keyof FilaProducto, valor: string) =>
    setProductos((prev) => prev.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!fecha) return setError('Elegí la fecha.')
    if (temp === '' || Number.isNaN(num(temp))) return setError('Ingresá la temperatura.')
    if (humedad === '' || num(humedad) < 0 || num(humedad) > 100) return setError('La humedad debe estar entre 0 y 100.')
    if (viento === '' || !(num(viento) >= 0)) return setError('Ingresá el viento (no puede ser negativo).')
    if (productos.length === 0) return setError('Agregá al menos un producto.')
    if (productos.some((p) => !(num(p.cantidad) > 0))) return setError('La cantidad de cada producto debe ser mayor a 0.')

    // Stock suficiente (se suman los renglones del mismo producto, igual que el backend)
    const total: Record<string, number> = {}
    for (const p of productos) total[p.producto] = (total[p.producto] ?? 0) + num(p.cantidad)
    for (const [nombre, cant] of Object.entries(total)) {
      const prod = catalogo.find((x) => x.nombre_comercial === nombre)!
      if (cant > prod.stock_actual) {
        return setError(`Stock insuficiente de ${nombre}. Disponible: ${prod.stock_actual} ${prod.unidad_medida}.`)
      }
    }

    const texto = productos
      .map((p) => {
        const prod = catalogo.find((x) => x.nombre_comercial === p.producto)!
        return `${p.producto} · ${num(p.cantidad)} ${prod.unidad_medida}`
      })
      .join(', ')

    void intentar(() =>
      onGuardar({
        id_orden_aplicacion: orden,
        fecha,
        temperatura: num(temp),
        humedad: num(humedad),
        viento: num(viento),
        productos: texto,
        observaciones: obs.trim(),
        consumo: Object.entries(total).map(([producto, cantidad]) => ({ producto, cantidad })),
      }),
    )
  }

  return (
    <>
      <Encabezado etiqueta={`Nueva · ${lote}`} titulo="Agregar aplicación" />
      <form className="campo-form" onSubmit={enviar}>
        <label>
          Orden de aplicación
          <select value={orden} onChange={(e) => setOrden(Number(e.target.value))}>
            {ordenes.map((o) => (
              <option key={o.id_orden_aplicacion} value={o.id_orden_aplicacion}>
                #{o.id_orden_aplicacion} · {o.objetivo}
              </option>
            ))}
          </select>
        </label>
        <Entrada etiqueta="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <div className="campo-fila tres">
          <Entrada etiqueta="Temp. (°C)" type="number" step="any" value={temp} onChange={(e) => setTemp(e.target.value)} />
          <Entrada etiqueta="Humedad (%)" type="number" min="0" max="100" step="any" value={humedad} onChange={(e) => setHumedad(e.target.value)} />
          <Entrada etiqueta="Viento (km/h)" type="number" min="0" step="any" value={viento} onChange={(e) => setViento(e.target.value)} />
        </div>

        <div className="filas-extra">
          <p className="filas-titulo">Productos</p>
          {productos.map((p, i) => {
            const prod = catalogo.find((x) => x.nombre_comercial === p.producto)!
            return (
              <div className="fila-producto" key={i}>
                <label>
                  Producto
                  <select value={p.producto} onChange={(e) => cambiar(i, 'producto', e.target.value)}>
                    {catalogo.map((x) => (
                      <option key={x.nombre_comercial} value={x.nombre_comercial}>{x.nombre_comercial}</option>
                    ))}
                  </select>
                </label>
                <Entrada etiqueta={`Cantidad (${prod.unidad_medida})`} type="number" min="0" step="any" value={p.cantidad} onChange={(e) => cambiar(i, 'cantidad', e.target.value)} />
                {productos.length > 1 && (
                  <button type="button" className="fila-quitar" aria-label="Quitar producto" onClick={() => setProductos((prev) => prev.filter((_, j) => j !== i))}>×</button>
                )}
              </div>
            )
          })}
          <button type="button" className="link-agregar" onClick={() => setProductos((p) => [...p, { producto: catalogo[0].nombre_comercial, cantidad: '' }])}>
            + Agregar producto
          </button>
        </div>

        <Observaciones valor={obs} onCambio={setObs} />
        <Pie error={error} enviando={enviando} texto="Guardar aplicación" />
      </form>
    </>
  )
}

/* ---------- Producto nuevo (solo ADMIN) ---------- */
const TIPOS_PRODUCTO = ['Herbicida', 'Insecticida', 'Fungicida', 'Fertilizante', 'Semilla', 'Nafta', 'Gasoil']
const UNIDADES_PRODUCTO = ['L', 'kg', 'g', 'cc']

export type NuevoProducto = Pick<Producto, 'nombre_comercial' | 'principio_activo' | 'concentracion' | 'tipo' | 'unidad_medida'> & {
  stock_inicial: number // si es mayor a 0, se registra como un ingreso de stock
}

export function FormProducto({ existentes, inicial, onGuardar }: { existentes: string[]; inicial?: Producto; onGuardar: (p: NuevoProducto) => void | Promise<void> }) {
  const [nombre, setNombre] = useState(inicial?.nombre_comercial ?? '')
  const [tipo, setTipo] = useState(inicial?.tipo ?? '')
  const [principio, setPrincipio] = useState(inicial?.principio_activo ?? '')
  const [concentracion, setConcentracion] = useState(inicial?.concentracion ?? '')
  const [unidad, setUnidad] = useState(inicial?.unidad_medida ?? '')
  const [stock, setStock] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return setError('Ingresá el nombre comercial.')
    if (existentes.some((n) => igual(n, nombre))) return setError('Ya existe un producto con ese nombre.')
    if (!tipo.trim()) return setError('Elegí el tipo de producto.')
    if (!principio.trim()) return setError('Ingresá el principio activo (si no aplica, poné —).')
    if (!concentracion.trim()) return setError('Ingresá la concentración (si no aplica, poné —).')
    if (!unidad.trim()) return setError('Elegí la unidad de medida.')
    if (stock !== '' && !(num(stock) >= 0)) return setError('El stock inicial no puede ser negativo.')
    void intentar(() =>
      onGuardar({
        nombre_comercial: nombre.trim(),
        tipo: tipo.trim(),
        principio_activo: principio.trim(),
        concentracion: concentracion.trim(),
        unidad_medida: unidad.trim(),
        stock_inicial: stock === '' ? 0 : num(stock),
      }),
    )
  }

  return (
    <>
      <Encabezado etiqueta={inicial ? inicial.nombre_comercial : 'Nuevo'} titulo={inicial ? 'Editar producto' : 'Agregar producto'} />
      <form className="campo-form" onSubmit={enviar}>
        <Entrada etiqueta="Nombre comercial" type="text" maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Glifosato Full II" />
        <div className="campo-fila">
          <Selector etiqueta="Tipo" valor={tipo} opciones={TIPOS_PRODUCTO} placeholder="Elegí el tipo" onCambio={setTipo} />
          <Selector etiqueta="Unidad de medida" valor={unidad} opciones={UNIDADES_PRODUCTO} placeholder="Elegí la unidad" onCambio={setUnidad} />
        </div>
        <div className="campo-fila">
          <Entrada etiqueta="Principio activo" type="text" maxLength={100} value={principio} onChange={(e) => setPrincipio(e.target.value)} placeholder="Glifosato" />
          <Entrada etiqueta="Concentración" type="text" maxLength={50} value={concentracion} onChange={(e) => setConcentracion(e.target.value)} placeholder="66,2 %" />
        </div>
        <p className="ayuda">Si el principio activo o la concentración no aplican (por ejemplo, en una semilla), poné —.</p>
        {!inicial && (
          <Entrada etiqueta="Stock inicial (opcional)" type="number" min="0" step="any" value={stock} onChange={(e) => setStock(e.target.value)} />
        )}
        <Pie error={error} enviando={enviando} texto={textoGuardar(inicial, 'Guardar producto')} />
      </form>
    </>
  )
}

/* ---------- Ingreso de stock de un producto existente (solo ADMIN) ---------- */
export function FormIngreso({ producto, onGuardar }: { producto: Producto; onGuardar: (cantidad: number, observacion: string) => void | Promise<void> }) {
  const [cantidad, setCantidad] = useState('')
  const [obs, setObs] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!(num(cantidad) > 0)) return setError('La cantidad debe ser mayor a 0.')
    void intentar(() => onGuardar(num(cantidad), obs.trim()))
  }

  return (
    <>
      <Encabezado etiqueta={producto.nombre_comercial} titulo="Ingresar stock" />
      <form className="campo-form" onSubmit={enviar}>
        <Entrada etiqueta={`Cantidad (${producto.unidad_medida})`} type="number" min="0" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <label>
          Observación (opcional)
          <input type="text" maxLength={255} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Compra a proveedor" />
        </label>
        <Pie error={error} enviando={enviando} texto="Registrar ingreso" />
      </form>
    </>
  )
}

/* ---------- Retiro de stock por vencimiento o devolución (solo ADMIN) ---------- */
export const MOTIVOS_RETIRO = ['Vencimiento', 'Devolución', 'Otro']

export function FormEgreso({ producto, onGuardar }: { producto: Producto; onGuardar: (cantidad: number, motivo: string, detalle: string) => void | Promise<void> }) {
  const [motivo, setMotivo] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [detalle, setDetalle] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!motivo) return setError('Elegí el motivo del retiro.')
    if (!(num(cantidad) > 0)) return setError('La cantidad debe ser mayor a 0.')
    if (num(cantidad) > producto.stock_actual) {
      return setError(`Stock insuficiente. Disponible: ${producto.stock_actual} ${producto.unidad_medida}.`)
    }
    if (motivo === 'Otro' && !detalle.trim()) return setError('Indicá cuál es el motivo.')
    void intentar(() => onGuardar(num(cantidad), motivo, detalle.trim()))
  }

  return (
    <>
      <Encabezado etiqueta={`${producto.nombre_comercial} · disponible ${producto.stock_actual} ${producto.unidad_medida}`} titulo="Retirar stock" />
      <form className="campo-form" onSubmit={enviar}>
        <Selector etiqueta="Motivo" valor={motivo} opciones={MOTIVOS_RETIRO} placeholder="Elegí el motivo" onCambio={setMotivo} />
        <Entrada etiqueta={`Cantidad (${producto.unidad_medida})`} type="number" min="0" step="any" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <label>
          {motivo === 'Otro' ? '¿Cuál es el motivo?' : 'Detalle (opcional)'}
          <input type="text" maxLength={200} value={detalle} onChange={(e) => setDetalle(e.target.value)} placeholder={motivo === 'Otro' ? 'Derrame, rotura del envase…' : 'Lote 2024-08, devuelto al proveedor…'} />
        </label>
        <Pie error={error} enviando={enviando} texto="Registrar retiro" />
      </form>
    </>
  )
}

/* ---------- Edición de un usuario y de su rol (solo ADMIN) ---------- */
export function FormUsuario({ usuario, esUnoMismo, existentes, onGuardar }: {
  usuario: Usuario
  esUnoMismo: boolean // un admin no puede cambiarse su propio rol
  existentes: string[] // nombres de usuario de las demás cuentas
  onGuardar: (c: CambiosUsuario) => void | Promise<void>
}) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [apellido, setApellido] = useState(usuario.apellido)
  const [nombreUsuario, setNombreUsuario] = useState(usuario.nombre_usuario)
  const [rol, setRol] = useState(usuario.rol === 'ADMIN' ? 'Administrador' : 'Campo')
  const [clave, setClave] = useState('')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim() || !apellido.trim()) return setError('Ingresá nombre y apellido.')
    if (nombreUsuario.trim().length < 3) return setError('El usuario debe tener al menos 3 caracteres.')
    if (existentes.some((n) => igual(n, nombreUsuario))) return setError('Ese nombre de usuario ya está en uso.')
    if (clave && clave.length < 8) return setError('La contraseña nueva debe tener al menos 8 caracteres.')
    const cambios: CambiosUsuario = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      nombre_usuario: nombreUsuario.trim(),
      rol: rol === 'Administrador' ? 'ADMIN' : 'CAMPO',
    }
    if (clave) cambios.contrasena = clave
    void intentar(() => onGuardar(cambios))
  }

  return (
    <>
      <Encabezado etiqueta={usuario.nombre_usuario} titulo="Editar usuario" />
      <form className="campo-form" onSubmit={enviar}>
        <div className="campo-fila">
          <Entrada etiqueta="Nombre" type="text" maxLength={50} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Entrada etiqueta="Apellido" type="text" maxLength={50} value={apellido} onChange={(e) => setApellido(e.target.value)} />
        </div>
        <Entrada etiqueta="Usuario" type="text" maxLength={50} value={nombreUsuario} onChange={(e) => setNombreUsuario(e.target.value)} />
        {esUnoMismo ? (
          <p className="suave">Tu propio rol no se puede cambiar.</p>
        ) : (
          <Selector etiqueta="Rol" valor={rol} opciones={['Administrador', 'Campo']} onCambio={setRol} />
        )}
        <Entrada etiqueta="Contraseña nueva (opcional)" type="password" maxLength={128} value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Dejá vacío para no cambiarla" autoComplete="new-password" />
        <Pie error={error} enviando={enviando} texto="Guardar cambios" />
      </form>
    </>
  )
}

/* ---------- Confirmación para borrar ---------- */
export function Confirmar({ etiqueta, titulo, mensaje, textoBoton, onConfirmar }: {
  etiqueta: string
  titulo: string
  mensaje: string
  textoBoton: string
  onConfirmar: () => void | Promise<void>
}) {
  const { error, enviando, intentar } = useEnvio()

  return (
    <>
      <Encabezado etiqueta={etiqueta} titulo={titulo} />
      <div className="campo-form">
        <p className="confirmar-texto">{mensaje}</p>
        {error && <p className="campo-error">{error}</p>}
        <button type="button" className="campo-guardar peligro" disabled={enviando} onClick={() => void intentar(onConfirmar)}>
          {enviando ? 'Eliminando…' : textoBoton}
        </button>
      </div>
    </>
  )
}
