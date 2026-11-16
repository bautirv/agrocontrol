import { api } from './api'
import type { Aplicacion, Campania, Campo, Cosecha, Datos, Labor, Lote, Orden, Producto, Riego } from './datos'
import type {
  NuevaAplicacion, NuevaCosecha, NuevaLabor, NuevaOrden, NuevoCampo, NuevoLote, NuevoProducto, NuevoRiego,
} from './Formularios'

/* Llamadas a la API. Convierten lo que devuelve el backend a los tipos de la app:
   los decimales pueden llegar como texto ("120.00"), las horas como "06:00:00"
   y los campos opcionales como null. */

const n = (v: number | string) => Number(v)
const hora = (h: string) => h.slice(0, 5)
const enc = encodeURIComponent

export type Donde = { nombre_campo: string; nombre_lote: string }

/* ---------- Campañas, campos y lotes ---------- */
export const listarCampanias = () => api<Campania[]>('/campanias/')

type CampoApi = Omit<Campo, 'nombre_campania'> & { nombre_campania: string | null }
const aCampo = (c: CampoApi, campania = ''): Campo => ({ ...c, nombre_campania: c.nombre_campania ?? campania })
export const listarCampos = async () => (await api<CampoApi[]>('/campos/')).map((c) => aCampo(c))

type LoteApi = Omit<Lote, 'fecha_siembra' | 'nombre_campo'> & { fecha_siembra: string | null; nombre_campo: string | null }
const aLote = (l: LoteApi, campo: string): Lote => ({ ...l, fecha_siembra: l.fecha_siembra ?? '', nombre_campo: l.nombre_campo ?? campo })

// Los lotes se piden campo por campo: /campos/{campo}/lotes
async function listarLotes(campos: Campo[]): Promise<Lote[]> {
  const listas = await Promise.all(
    campos.map(async (c) => (await api<LoteApi[]>(`/campos/${enc(c.nombre)}/lotes`)).map((l) => aLote(l, c.nombre))),
  )
  return listas.flat()
}

export const crearCampania = (c: Omit<Campania, 'id_campania'>) =>
  api<Campania>('/campanias/', { method: 'POST', body: JSON.stringify(c) })

export async function crearCampo(campania: string, c: NuevoCampo): Promise<Campo> {
  const r = await api<CampoApi>('/campos/', { method: 'POST', body: JSON.stringify({ ...c, nombre_campania: campania }) })
  return aCampo(r, campania)
}

export async function crearLote(campo: string, l: NuevoLote): Promise<Lote> {
  const cuerpo = { ...l, fecha_siembra: l.fecha_siembra || null }
  const r = await api<LoteApi>(`/campos/${enc(campo)}/lotes`, { method: 'POST', body: JSON.stringify(cuerpo) })
  return aLote(r, campo)
}

/* ---------- Labores, riegos, cosechas, órdenes y aplicaciones ---------- */
type LaborApi = Omit<Labor, 'observaciones'> & { observaciones: string | null }
const aLabor = (l: LaborApi): Labor => ({ ...l, observaciones: l.observaciones ?? '' })

type RiegoApi = Omit<Riego, 'cantidad_agua' | 'observaciones'> & {
  cantidad_agua: number | string
  observaciones: string | null
}
const aRiego = (r: RiegoApi): Riego => ({
  id_riego: r.id_riego,
  fecha: r.fecha,
  hora_inicio: hora(r.hora_inicio),
  hora_fin: hora(r.hora_fin),
  cantidad_agua: n(r.cantidad_agua),
  nombre_lote: r.nombre_lote,
  nombre_campo: r.nombre_campo,
  observaciones: r.observaciones ?? '',
})

type CosechaApi = Omit<Cosecha, 'cantidad_cosechada' | 'camiones' | 'observaciones'> & {
  cantidad_cosechada: number | string
  observaciones: string | null
  camiones: unknown[]
}
const aCosecha = (c: CosechaApi): Cosecha => ({
  id_cosecha: c.id_cosecha,
  fecha: c.fecha,
  cantidad_cosechada: n(c.cantidad_cosechada),
  nombre_lote: c.nombre_lote,
  nombre_campo: c.nombre_campo,
  dtve: c.dtve,
  camiones: c.camiones.length,
  observaciones: c.observaciones ?? '',
})

type OrdenApi = Omit<Orden, 'observaciones' | 'estado'> & { observaciones: string | null; estado: string }
const aOrden = (o: OrdenApi): Orden => ({ ...o, observaciones: o.observaciones ?? '', estado: o.estado as Orden['estado'] })

type AplicacionApi = {
  id_aplicacion: number
  fecha: string
  temperatura: number | string
  humedad: number | string
  viento: number | string
  observaciones: string | null
  nombre_campo: string
  nombre_lote: string
  productos: { nombre_producto: string; cantidad: number | string; unidad_medida: string }[]
}
const aAplicacion = (a: AplicacionApi): Aplicacion => ({
  id_aplicacion: a.id_aplicacion,
  fecha: a.fecha,
  temperatura: n(a.temperatura),
  humedad: n(a.humedad),
  viento: n(a.viento),
  nombre_lote: a.nombre_lote,
  nombre_campo: a.nombre_campo,
  productos: a.productos.map((p) => `${p.nombre_producto} · ${n(p.cantidad)} ${p.unidad_medida}`).join(', '),
  observaciones: a.observaciones ?? '',
})

export const listarOrdenes = async () => (await api<OrdenApi[]>('/ordenes-aplicacion/')).map(aOrden)

const post = <T>(ruta: string, cuerpo: unknown) => api<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo) })

export async function crearLabor(d: Donde, l: NuevaLabor) {
  return aLabor(await post<LaborApi>('/labores/', { ...l, observaciones: l.observaciones || null, ...d }))
}

export async function crearRiego(d: Donde, r: NuevoRiego) {
  return aRiego(await post<RiegoApi>('/riegos/', { ...r, observaciones: r.observaciones || null, ...d }))
}

export async function crearCosecha(d: Donde, c: NuevaCosecha) {
  const cuerpo = {
    ...c,
    observaciones: c.observaciones || null,
    camiones: c.camiones.map((t) => ({ ...t, observaciones: null })),
    ...d,
  }
  return aCosecha(await post<CosechaApi>('/cosechas/', cuerpo))
}

export async function crearOrden(d: Donde, o: NuevaOrden) {
  return aOrden(await post<OrdenApi>('/ordenes-aplicacion/', { ...o, observaciones: o.observaciones || null, ...d }))
}

export async function crearAplicacion(d: Donde, a: NuevaAplicacion) {
  const { consumo, ...resto } = a
  const cuerpo = {
    ...resto,
    observaciones: resto.observaciones || null,
    productos: consumo.map((c) => ({ nombre_producto: c.producto, cantidad: c.cantidad })),
    ...d,
  }
  return aAplicacion(await post<AplicacionApi>('/aplicaciones/', cuerpo))
}

/* ---------- Editar y borrar ---------- */
// Solo un ADMIN puede editar y borrar. El backend rechaza borrar lo que tiene datos asociados
// (una campaña con campos, un campo con lotes, un lote con registros) y explica el motivo.
const put = <T>(ruta: string, cuerpo: unknown) => api<T>(ruta, { method: 'PUT', body: JSON.stringify(cuerpo) })
const borrar = (ruta: string) => api<void>(ruta, { method: 'DELETE' })

export const editarCampania = (nombre: string, c: Omit<Campania, 'id_campania'>) =>
  put<Campania>(`/campanias/${enc(nombre)}`, c)
export const eliminarCampania = (nombre: string) => borrar(`/campanias/${enc(nombre)}`)

export const editarCampo = (nombre: string, campania: string, c: NuevoCampo) =>
  put(`/campos/${enc(nombre)}`, { ...c, nombre_campania: campania })
export const eliminarCampo = (nombre: string) => borrar(`/campos/${enc(nombre)}`)

export const editarLote = (campo: string, lote: string, l: NuevoLote) =>
  put(`/campos/${enc(campo)}/lotes/${enc(lote)}`, { ...l, fecha_siembra: l.fecha_siembra || null })
export const eliminarLote = (campo: string, lote: string) => borrar(`/campos/${enc(campo)}/lotes/${enc(lote)}`)

export async function editarLabor(id: number, d: Donde, l: NuevaLabor) {
  return aLabor(await put<LaborApi>(`/labores/${id}`, { ...l, observaciones: l.observaciones || null, ...d }))
}
export const eliminarLabor = (id: number) => borrar(`/labores/${id}`)

export async function editarRiego(id: number, d: Donde, r: NuevoRiego) {
  return aRiego(await put<RiegoApi>(`/riegos/${id}`, { ...r, observaciones: r.observaciones || null, ...d }))
}
export const eliminarRiego = (id: number) => borrar(`/riegos/${id}`)

// Las cosechas no se editan (el backend no lo permite): solo se pueden eliminar
export const eliminarCosecha = (id: number) => borrar(`/cosechas/${id}`)

/* ---------- Carga inicial de la pantalla de campañas ---------- */
export async function cargarTodo(): Promise<{ campanias: Campania[]; datos: Datos }> {
  const [campanias, campos, labores, riegos, aplicaciones, ordenes, cosechas] = await Promise.all([
    listarCampanias(),
    listarCampos(),
    api<LaborApi[]>('/labores/').then((l) => l.map(aLabor)),
    api<RiegoApi[]>('/riegos/').then((r) => r.map(aRiego)),
    api<AplicacionApi[]>('/aplicaciones/').then((a) => a.map(aAplicacion)),
    listarOrdenes(),
    api<CosechaApi[]>('/cosechas/').then((c) => c.map(aCosecha)),
  ])
  const lotes = await listarLotes(campos)
  return { campanias, datos: { campos, lotes, labores, riegos, aplicaciones, ordenes, cosechas } }
}

/* ---------- Productos y stock ---------- */
type ProductoApi = Omit<Producto, 'stock_actual'>
type StockApi = { nombre_producto: string; unidad_medida: string; stock_actual: number | string }

// El stock no es un dato del producto: se calcula con los ingresos y egresos (/stock/)
export async function listarProductos(): Promise<Producto[]> {
  const [productos, stock] = await Promise.all([api<ProductoApi[]>('/productos/'), api<StockApi[]>('/stock/')])
  const actual = new Map(stock.map((s) => [s.nombre_producto, n(s.stock_actual)]))
  return productos.map((p) => ({ ...p, stock_actual: actual.get(p.nombre_comercial) ?? 0 }))
}

export function ingresarStock(producto: string, cantidad: number, observacion: string) {
  return post('/stock/movimientos', {
    tipo: 'INGRESO',
    cantidad,
    observacion: observacion || null,
    nombre_producto: producto,
  })
}

// Retiro de stock: el motivo (vencimiento o devolución) queda en la observación del movimiento
export function retirarStock(producto: string, cantidad: number, motivo: string, detalle: string) {
  return post('/stock/movimientos', {
    tipo: 'EGRESO',
    cantidad,
    observacion: detalle ? `${motivo}: ${detalle}` : motivo,
    nombre_producto: producto,
  })
}

export async function editarProducto(nombreActual: string, p: Omit<NuevoProducto, 'stock_inicial'>) {
  await put(`/productos/${enc(nombreActual)}`, p)
}
export const eliminarProducto = (nombre: string) => borrar(`/productos/${enc(nombre)}`)

export async function crearProducto({ stock_inicial, ...p }: NuevoProducto): Promise<Producto> {
  await post('/productos/', p)
  if (stock_inicial > 0) await ingresarStock(p.nombre_comercial, stock_inicial, 'Stock inicial')
  return { ...p, stock_actual: stock_inicial }
}

/* ---------- Usuarios (solo ADMIN) ---------- */
export type Usuario = { id_usuario: number; nombre: string; apellido: string; nombre_usuario: string; rol: 'ADMIN' | 'CAMPO' }
export type CambiosUsuario = { nombre: string; apellido: string; nombre_usuario: string; rol: 'ADMIN' | 'CAMPO'; contrasena?: string }

export const listarUsuarios = () => api<Usuario[]>('/usuarios/')
export const editarUsuario = (id: number, c: CambiosUsuario) => put<Usuario>(`/usuarios/${id}`, c)
export const eliminarUsuario = (id: number) => borrar(`/usuarios/${id}`)
