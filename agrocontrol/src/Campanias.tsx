import { useEffect, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'
import Modal from './Modal'
import './Campanias.css'
import type { Campania, Campo, Lote, Labor, Riego, Producto, Datos } from './datos'
import * as svc from './servicios'
import {
  FormCampo, FormLote, FormLabor, FormRiego, FormCosecha, FormOrden, FormAplicacion, Confirmar, Pie, useEnvio,
  type NuevoCampo, type NuevoLote,
} from './Formularios'

// Botones de la cabecera de una campaña, un campo o un lote (solo ADMIN)
function BotonesEdicion({ onEditar, onEliminar }: { onEditar: () => void; onEliminar: () => void }) {
  return (
    <div className="acciones-centro acciones-cabecera">
      <button type="button" className="agregar secundario" onClick={onEditar}>Editar</button>
      <button type="button" className="agregar peligro" onClick={onEliminar}>Eliminar</button>
    </div>
  )
}

function formatearFecha(f: string | null) {
  if (!f) return '—'
  const [a, m, d] = f.split('-')
  return `${d}/${m}/${a}`
}

// Una campaña es "actual" mientras su fecha de fin no haya pasado (se calcula, no se guarda)
const hoy = () => new Date().toISOString().slice(0, 10)
// Sin fecha de fin (es opcional en el backend) la campaña sigue actual
const esActual = (c: Campania) => c.fecha_fin === null || c.fecha_fin >= hoy()

/* ---------- Cuadro de una campaña ---------- */
function Cuadro({ c, campos, onAbrir }: { c: Campania; campos: number; onAbrir: () => void }) {
  return (
    <article
      className="campania"
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAbrir()
        }
      }}
    >
      <span className="campania-periodo">{esActual(c) ? 'Actual' : 'Finalizada'}</span>
      <h3 className="campania-nombre">{c.nombre}</h3>
      <dl className="campania-datos">
        <div><dt>Inicio</dt><dd>{formatearFecha(c.fecha_inicio)}</dd></div>
        <div><dt>Fin</dt><dd>{formatearFecha(c.fecha_fin)}</dd></div>
        <div><dt>Campos</dt><dd>{campos}</dd></div>
      </dl>
    </article>
  )
}

/* ---------- Pantalla de una campaña ---------- */
function DetalleCampania({
  c, campos, nombresCampos, nombresCampanias, esAdmin, onGuardarCampo, onEditar, onEliminar, onVolver, onAbrirCampo,
}: {
  c: Campania
  campos: Campo[]
  nombresCampos: string[]
  nombresCampanias: string[]
  esAdmin: boolean
  onGuardarCampo: (nuevo: NuevoCampo) => void | Promise<void>
  onEditar: (c: Omit<Campania, 'id_campania'>) => void | Promise<void>
  onEliminar: () => void | Promise<void>
  onVolver: () => void
  onAbrirCampo: (nombre: string) => void
}) {
  const [agregando, setAgregando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const total = campos.reduce((s, k) => s + k.superficie_total, 0)
  const filas: [string, string][] = [
    ['Fecha de inicio', formatearFecha(c.fecha_inicio)],
    ['Fecha de fin', formatearFecha(c.fecha_fin)],
    ['Estado', esActual(c) ? 'Actual' : 'Finalizada'],
    ['Campos', String(campos.length)],
    ['Superficie total', `${total} ha`],
  ]

  return (
    <section>
      <button type="button" className="volver" onClick={onVolver}>
        ← Volver a campañas
      </button>

      <div className="encabezado-detalle">
        <p className="etiqueta">Campaña</p>
        <h2 className="titulo">{c.nombre}</h2>
      </div>
      {esAdmin && <BotonesEdicion onEditar={() => setEditando(true)} onEliminar={() => setEliminando(true)} />}

      <div className="info">
        <dl className="detalle">
          {filas.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </div>

      <h3 className="subtitulo centrado">Campos</h3>
      {esAdmin && (
        <div className="acciones-centro">
          <button type="button" className="agregar" onClick={() => setAgregando(true)}>+ Agregar campo</button>
        </div>
      )}
      {campos.length > 0 ? (
        <div className="campos-grilla">
          {campos.map((k) => (
            <button key={k.id_campo} type="button" className="campo-cuadro" onClick={() => onAbrirCampo(k.nombre)}>
              <span className="campania-periodo">{k.ubicacion}</span>
              <span className="campo-nombre">{k.nombre}</span>
              <span className="campo-ha">{k.superficie_total} ha</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="aviso centrado">Esta campaña no tiene campos cargados.</p>
      )}

      {agregando && (
        <Modal titulo="Agregar campo" onCerrar={() => setAgregando(false)}>
          <FormCampo
            campania={c.nombre}
            existentes={nombresCampos}
            onGuardar={async (nuevo) => {
              await onGuardarCampo(nuevo)
              setAgregando(false)
            }}
          />
        </Modal>
      )}

      {editando && (
        <Modal titulo="Editar campaña" onCerrar={() => setEditando(false)}>
          <Formulario
            inicial={c}
            existentes={nombresCampanias.filter((n) => n !== c.nombre)}
            onGuardar={async (x) => {
              await onEditar(x)
              setEditando(false)
            }}
          />
        </Modal>
      )}

      {eliminando && (
        <Modal titulo="Eliminar campaña" onCerrar={() => setEliminando(false)}>
          <Confirmar
            etiqueta={c.nombre}
            titulo="Eliminar campaña"
            mensaje={`¿Seguro que querés eliminar "${c.nombre}"? Esta acción no se puede deshacer. Solo se puede eliminar una campaña que no tenga campos.`}
            textoBoton="Sí, eliminar"
            onConfirmar={async () => {
              await onEliminar()
              setEliminando(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}

/* ---------- Secciones de un lote (datos de ejemplo, forma igual al backend) ---------- */
type Seccion = 'labores' | 'riegos' | 'aplicaciones' | 'cosechas'

const SECCIONES: { id: Seccion; nombre: string; detalle: string }[] = [
  { id: 'labores', nombre: 'Labores', detalle: 'Trabajos realizados en el lote' },
  { id: 'riegos', nombre: 'Riegos', detalle: 'Agua aplicada y horarios' },
  { id: 'aplicaciones', nombre: 'Aplicaciones', detalle: 'Productos y condiciones' },
  { id: 'cosechas', nombre: 'Cosechas', detalle: 'Cantidad cosechada y camiones' },
]

function Tabla({ cols, filas, acciones }: { cols: string[]; filas: (string | number)[][]; acciones?: (i: number) => ReactNode }) {
  if (filas.length === 0) return <p className="aviso centrado">Todavía no hay registros en este lote.</p>
  return (
    <div className="tabla-caja">
      <table className="tabla">
        <thead>
          <tr>
            {cols.map((c) => <th key={c}>{c}</th>)}
            {acciones && <th />}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {f.map((v, j) => <td key={j}>{v === '' ? '—' : v}</td>)}
              {acciones && <td><div className="acciones-fila">{acciones(i)}</div></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Registros de un lote (un mismo nombre de lote puede repetirse en otro campo, por eso se filtra por los dos)
function registrosDe(seccion: Seccion, lote: Lote, datos: Datos) {
  const f = formatearFecha
  const mio = <T extends { nombre_campo: string; nombre_lote: string }>(l: T[]) =>
    l.filter((x) => x.nombre_campo === lote.nombre_campo && x.nombre_lote === lote.nombre)

  switch (seccion) {
    case 'labores':
      return {
        cols: ['Fecha', 'Tipo', 'Responsable', 'Observaciones'],
        filas: mio(datos.labores).map((l) => [f(l.fecha), l.tipo, l.nombre_usuario, l.observaciones]),
      }
    case 'riegos':
      return {
        cols: ['Fecha', 'Horario', 'Agua', 'Observaciones'],
        filas: mio(datos.riegos).map((r) => [f(r.fecha), `${r.hora_inicio} – ${r.hora_fin}`, r.cantidad_agua, r.observaciones]),
      }
    case 'aplicaciones':
      return {
        cols: ['Fecha', 'Productos', 'Temp.', 'Humedad', 'Viento'],
        filas: mio(datos.aplicaciones).map((a) => [f(a.fecha), a.productos, `${a.temperatura} °C`, `${a.humedad} %`, `${a.viento} km/h`]),
      }
    case 'cosechas':
      return {
        cols: ['Fecha', 'Cosechado', 'DTV-e', 'Camiones', 'Observaciones'],
        filas: mio(datos.cosechas).map((c) => [f(c.fecha), c.cantidad_cosechada, c.dtve, c.camiones, c.observaciones ?? '']),
      }
  }
}

/* ---------- Pantalla de un campo: lista de lotes ---------- */
function DetalleCampo({
  campo, lotes, nombresCampos, esAdmin, onGuardarLote, onEditar, onEliminar, onVolver, onAbrirLote,
}: {
  campo: Campo
  lotes: Lote[]
  nombresCampos: string[]
  esAdmin: boolean
  onGuardarLote: (nuevo: NuevoLote) => void | Promise<void>
  onEditar: (c: NuevoCampo) => void | Promise<void>
  onEliminar: () => void | Promise<void>
  onVolver: () => void
  onAbrirLote: (nombre: string) => void
}) {
  const [agregando, setAgregando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  return (
    <section>
      <button type="button" className="volver" onClick={onVolver}>
        ← Volver a {campo.nombre_campania}
      </button>

      <div className="encabezado-detalle">
        <p className="etiqueta">Campo</p>
        <h2 className="titulo">{campo.nombre}</h2>
      </div>
      {esAdmin && <BotonesEdicion onEditar={() => setEditando(true)} onEliminar={() => setEliminando(true)} />}

      <div className="info">
        <dl className="detalle">
          <div><dt>Campaña</dt><dd>{campo.nombre_campania}</dd></div>
          <div><dt>Ubicación</dt><dd>{campo.ubicacion}</dd></div>
          <div><dt>Superficie total</dt><dd>{campo.superficie_total} ha</dd></div>
          <div><dt>Lotes</dt><dd>{lotes.length}</dd></div>
        </dl>
      </div>

      <h3 className="subtitulo centrado">Lotes</h3>
      {esAdmin && (
        <div className="acciones-centro">
          <button type="button" className="agregar" onClick={() => setAgregando(true)}>+ Agregar lote</button>
        </div>
      )}
      {lotes.length > 0 ? (
        <div className="campanias-grilla lotes-grilla">
          {lotes.map((l) => (
            <article
              key={l.nombre}
              className="campania"
              role="button"
              tabIndex={0}
              onClick={() => onAbrirLote(l.nombre)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onAbrirLote(l.nombre)
                }
              }}
            >
              <span className="campania-periodo">{l.variedad}</span>
              <h3 className="campania-nombre">{l.nombre}</h3>
              <dl className="campania-datos">
                <div><dt>Superficie</dt><dd>{l.superficie} ha</dd></div>
                <div><dt>Siembra</dt><dd>{formatearFecha(l.fecha_siembra)}</dd></div>
                <div><dt>Semilla</dt><dd>{l.cantidad_semilla} kg</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="aviso centrado">Este campo no tiene lotes cargados.</p>
      )}

      {agregando && (
        <Modal titulo="Agregar lote" onCerrar={() => setAgregando(false)}>
          <FormLote
            campo={campo.nombre}
            existentes={lotes.map((l) => l.nombre)}
            onGuardar={async (nuevo) => {
              await onGuardarLote(nuevo)
              setAgregando(false)
            }}
          />
        </Modal>
      )}

      {editando && (
        <Modal titulo="Editar campo" onCerrar={() => setEditando(false)}>
          <FormCampo
            campania={campo.nombre_campania}
            inicial={campo}
            existentes={nombresCampos.filter((n) => n !== campo.nombre)}
            onGuardar={async (x) => {
              await onEditar(x)
              setEditando(false)
            }}
          />
        </Modal>
      )}

      {eliminando && (
        <Modal titulo="Eliminar campo" onCerrar={() => setEliminando(false)}>
          <Confirmar
            etiqueta={campo.nombre}
            titulo="Eliminar campo"
            mensaje={`¿Seguro que querés eliminar "${campo.nombre}"? Esta acción no se puede deshacer. Solo se puede eliminar un campo que no tenga lotes.`}
            textoBoton="Sí, eliminar"
            onConfirmar={async () => {
              await onEliminar()
              setEliminando(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}

/* ---------- Pantalla de un lote: las 4 secciones ---------- */
function DetalleLote({
  lote, datos, nombresLotes, esAdmin, onEditar, onEliminar, onVolver, onAbrirSeccion,
}: {
  lote: Lote
  datos: Datos
  nombresLotes: string[]
  esAdmin: boolean
  onEditar: (l: NuevoLote) => void | Promise<void>
  onEliminar: () => void | Promise<void>
  onVolver: () => void
  onAbrirSeccion: (s: Seccion) => void
}) {
  const [editando, setEditando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  return (
    <section>
      <button type="button" className="volver" onClick={onVolver}>
        ← Volver a {lote.nombre_campo}
      </button>

      <div className="encabezado-detalle">
        <p className="etiqueta">Lote · {lote.nombre_campo}</p>
        <h2 className="titulo">{lote.nombre}</h2>
      </div>
      {esAdmin && <BotonesEdicion onEditar={() => setEditando(true)} onEliminar={() => setEliminando(true)} />}

      <div className="info">
        <dl className="detalle">
          <div><dt>Variedad</dt><dd>{lote.variedad}</dd></div>
          <div><dt>Superficie</dt><dd>{lote.superficie} ha</dd></div>
          <div><dt>Fecha de siembra</dt><dd>{formatearFecha(lote.fecha_siembra)}</dd></div>
          <div><dt>Semilla</dt><dd>{lote.cantidad_semilla} kg</dd></div>
        </dl>
      </div>

      <h3 className="subtitulo centrado">Registros del lote</h3>
      <div className="secciones-grilla">
        {SECCIONES.map((s, i) => {
          const cant = registrosDe(s.id, lote, datos).filas.length
          return (
            <button key={s.id} type="button" className="seccion-cuadro" onClick={() => onAbrirSeccion(s.id)}>
              <span className="seccion-indice" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className="seccion-nombre">{s.nombre}</span>
              <span className="seccion-detalle">{s.detalle}</span>
              <span className="seccion-pie">
                <span className="seccion-cuenta">{cant} {cant === 1 ? 'registro' : 'registros'}</span>
                <span className="seccion-flecha">→</span>
              </span>
            </button>
          )
        })}
      </div>

      {editando && (
        <Modal titulo="Editar lote" onCerrar={() => setEditando(false)}>
          <FormLote
            campo={lote.nombre_campo}
            inicial={lote}
            existentes={nombresLotes.filter((n) => n !== lote.nombre)}
            onGuardar={async (x) => {
              await onEditar(x)
              setEditando(false)
            }}
          />
        </Modal>
      )}

      {eliminando && (
        <Modal titulo="Eliminar lote" onCerrar={() => setEliminando(false)}>
          <Confirmar
            etiqueta={`${lote.nombre_campo} · ${lote.nombre}`}
            titulo="Eliminar lote"
            mensaje={`¿Seguro que querés eliminar "${lote.nombre}"? Esta acción no se puede deshacer. Solo se puede eliminar un lote que no tenga registros.`}
            textoBoton="Sí, eliminar"
            onConfirmar={async () => {
              await onEliminar()
              setEliminando(false)
            }}
          />
        </Modal>
      )}
    </section>
  )
}

/* ---------- Pantalla de una sección de un lote ---------- */
type SeccionProps = {
  lote: Lote
  seccion: Seccion
  datos: Datos
  setDatos: Dispatch<SetStateAction<Datos>>
  productos: Producto[]
  setProductos: Dispatch<SetStateAction<Producto[]>>
  esAdmin: boolean
  onVolver: () => void
}

function DetalleSeccion({ lote, seccion, datos, setDatos, productos, setProductos, esAdmin, onVolver }: SeccionProps) {
  const [abierto, setAbierto] = useState<'registro' | 'orden' | null>(null)
  const [editando, setEditando] = useState<{ tipo: 'labor'; item: Labor } | { tipo: 'riego'; item: Riego } | null>(null)
  const [borrando, setBorrando] = useState<{ tipo: 'labor' | 'riego' | 'cosecha'; id: number; texto: string } | null>(null)
  const info = SECCIONES.find((s) => s.id === seccion)!
  const { cols, filas } = registrosDe(seccion, lote, datos)

  const donde = { nombre_lote: lote.nombre, nombre_campo: lote.nombre_campo }
  const cerrar = () => setAbierto(null)

  // Los registros del lote, en el mismo orden que las filas de la tabla
  const delLote = <T extends { nombre_campo: string; nombre_lote: string }>(l: T[]) =>
    l.filter((x) => x.nombre_campo === lote.nombre_campo && x.nombre_lote === lote.nombre)
  const laboresLote = delLote(datos.labores)
  const riegosLote = delLote(datos.riegos)
  const cosechasLote = delLote(datos.cosechas)

  const botones = (editar: (() => void) | null, eliminar: () => void) => (
    <>
      {editar && <button type="button" className="link-agregar" onClick={editar}>Editar</button>}
      <button type="button" className="link-agregar peligro" onClick={eliminar}>Eliminar</button>
    </>
  )

  // Solo un ADMIN edita o borra. Las aplicaciones no se pueden (el backend lo impide) y las cosechas solo se borran.
  const acciones = !esAdmin
    ? undefined
    : seccion === 'labores'
      ? (i: number) => botones(
          () => setEditando({ tipo: 'labor', item: laboresLote[i] }),
          () => setBorrando({ tipo: 'labor', id: laboresLote[i].id_labor, texto: `la labor "${laboresLote[i].tipo}" del ${formatearFecha(laboresLote[i].fecha)}` }),
        )
      : seccion === 'riegos'
        ? (i: number) => botones(
            () => setEditando({ tipo: 'riego', item: riegosLote[i] }),
            () => setBorrando({ tipo: 'riego', id: riegosLote[i].id_riego, texto: `el riego del ${formatearFecha(riegosLote[i].fecha)}` }),
          )
        : seccion === 'cosechas'
          ? (i: number) => botones(
              null,
              () => setBorrando({ tipo: 'cosecha', id: cosechasLote[i].id_cosecha, texto: `la cosecha ${cosechasLote[i].dtve} del ${formatearFecha(cosechasLote[i].fecha)}` }),
            )
          : undefined

  const ordenesLote = datos.ordenes.filter((o) => o.nombre_campo === lote.nombre_campo && o.nombre_lote === lote.nombre)
  const pendientes = ordenesLote.filter((o) => o.estado === 'PENDIENTE')

  const titulosAgregar: Record<Seccion, string> = {
    labores: '+ Agregar labor',
    riegos: '+ Agregar riego',
    aplicaciones: '+ Agregar aplicación',
    cosechas: '+ Agregar cosecha',
  }

  return (
    <section>
      <button type="button" className="volver" onClick={onVolver}>
        ← Volver a {lote.nombre}
      </button>

      <div className="encabezado-detalle">
        <p className="etiqueta">{lote.nombre_campo} · {lote.nombre}</p>
        <h2 className="titulo">{info.nombre}</h2>
      </div>

      <div className="acciones-centro">
        <button type="button" className="agregar" onClick={() => setAbierto('registro')}>{titulosAgregar[seccion]}</button>
        {seccion === 'aplicaciones' && esAdmin && (
          <button type="button" className="agregar secundario" onClick={() => setAbierto('orden')}>+ Nueva orden</button>
        )}
      </div>

      <div className="seccion-tabla">
        <Tabla cols={cols} filas={filas} acciones={acciones} />
      </div>

      {seccion === 'aplicaciones' && ordenesLote.length > 0 && (
        <>
          <h3 className="subtitulo centrado">Órdenes de aplicación</h3>
          <Tabla
            cols={['N.º', 'Fecha', 'Objetivo', 'Estado', 'Emitida por']}
            filas={ordenesLote.map((o) => [o.id_orden_aplicacion, formatearFecha(o.fecha), o.objetivo, o.estado.charAt(0) + o.estado.slice(1).toLowerCase(), o.nombre_usuario])}
          />
        </>
      )}

      {abierto === 'registro' && (
        <Modal titulo={info.nombre} onCerrar={cerrar}>
          {seccion === 'labores' && (
            <FormLabor
              lote={lote.nombre}
              onGuardar={async (x) => {
                const creada = await svc.crearLabor(donde, x)
                setDatos((d) => ({ ...d, labores: [creada, ...d.labores] }))
                cerrar()
              }}
            />
          )}
          {seccion === 'riegos' && (
            <FormRiego
              lote={lote.nombre}
              onGuardar={async (x) => {
                const creado = await svc.crearRiego(donde, x)
                setDatos((d) => ({ ...d, riegos: [creado, ...d.riegos] }))
                cerrar()
              }}
            />
          )}
          {seccion === 'cosechas' && (
            <FormCosecha
              lote={lote.nombre}
              onGuardar={async (x) => {
                const creada = await svc.crearCosecha(donde, x)
                setDatos((d) => ({ ...d, cosechas: [creada, ...d.cosechas] }))
                cerrar()
              }}
            />
          )}
          {seccion === 'aplicaciones' && (
            <FormAplicacion
              lote={lote.nombre}
              ordenes={pendientes}
              catalogo={productos}
              onGuardar={async (x) => {
                const creada = await svc.crearAplicacion(donde, x)
                setDatos((d) => ({ ...d, aplicaciones: [creada, ...d.aplicaciones] }))
                cerrar()
                // El backend descontó el stock y pasó la orden a REALIZADA: se vuelven a pedir
                svc.listarProductos().then(setProductos).catch(() => {})
                svc.listarOrdenes().then((ordenes) => setDatos((d) => ({ ...d, ordenes }))).catch(() => {})
              }}
            />
          )}
        </Modal>
      )}

      {editando && (
        <Modal titulo={editando.tipo === 'labor' ? 'Editar labor' : 'Editar riego'} onCerrar={() => setEditando(null)}>
          {editando.tipo === 'labor' ? (
            <FormLabor
              lote={lote.nombre}
              inicial={editando.item}
              onGuardar={async (x) => {
                const r = await svc.editarLabor(editando.item.id_labor, donde, x)
                setDatos((d) => ({ ...d, labores: d.labores.map((l) => (l.id_labor === r.id_labor ? r : l)) }))
                setEditando(null)
              }}
            />
          ) : (
            <FormRiego
              lote={lote.nombre}
              inicial={editando.item}
              onGuardar={async (x) => {
                const r = await svc.editarRiego(editando.item.id_riego, donde, x)
                setDatos((d) => ({ ...d, riegos: d.riegos.map((g) => (g.id_riego === r.id_riego ? r : g)) }))
                setEditando(null)
              }}
            />
          )}
        </Modal>
      )}

      {borrando && (
        <Modal titulo="Eliminar registro" onCerrar={() => setBorrando(null)}>
          <Confirmar
            etiqueta={`${lote.nombre_campo} · ${lote.nombre}`}
            titulo="Eliminar registro"
            mensaje={`¿Seguro que querés eliminar ${borrando.texto}? Esta acción no se puede deshacer.`}
            textoBoton="Sí, eliminar"
            onConfirmar={async () => {
              if (borrando.tipo === 'labor') {
                await svc.eliminarLabor(borrando.id)
                setDatos((d) => ({ ...d, labores: d.labores.filter((l) => l.id_labor !== borrando.id) }))
              } else if (borrando.tipo === 'riego') {
                await svc.eliminarRiego(borrando.id)
                setDatos((d) => ({ ...d, riegos: d.riegos.filter((r) => r.id_riego !== borrando.id) }))
              } else {
                await svc.eliminarCosecha(borrando.id)
                setDatos((d) => ({ ...d, cosechas: d.cosechas.filter((c) => c.id_cosecha !== borrando.id) }))
              }
              setBorrando(null)
            }}
          />
        </Modal>
      )}

      {abierto === 'orden' && (
        <Modal titulo="Nueva orden" onCerrar={cerrar}>
          <FormOrden
            lote={lote.nombre}
            onGuardar={async (x) => {
              const creada = await svc.crearOrden(donde, x)
              setDatos((d) => ({ ...d, ordenes: [creada, ...d.ordenes] }))
              cerrar()
            }}
          />
        </Modal>
      )}
    </section>
  )
}

/* ---------- Formulario para agregar (los 3 datos que pide el backend) ---------- */
function Formulario({ existentes, inicial, onGuardar }: { existentes: string[]; inicial?: Campania; onGuardar: (c: Omit<Campania, 'id_campania'>) => void | Promise<void> }) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [inicio, setInicio] = useState(inicial?.fecha_inicio ?? '')
  const [fin, setFin] = useState(inicial?.fecha_fin ?? '')
  const { error, setError, enviando, intentar } = useEnvio()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (nombre.trim().length < 4) return setError('El nombre debe tener al menos 4 caracteres.')
    if (existentes.some((n) => n.toLowerCase() === nombre.trim().toLowerCase())) return setError('Ya existe una campaña con ese nombre.')
    if (!inicio) return setError('Elegí la fecha de inicio.')
    if (fin && fin < inicio) return setError('La fecha de fin no puede ser anterior a la de inicio.')
    void intentar(() => onGuardar({ nombre: nombre.trim(), fecha_inicio: inicio, fecha_fin: fin || null }))
  }

  return (
    <>
      <p className="etiqueta">{inicial ? inicial.nombre : 'Nueva'}</p>
      <h3 className="modal-titulo">{inicial ? 'Editar campaña' : 'Agregar campaña'}</h3>

      <form className="campo-form" onSubmit={enviar}>
        <label>
          Nombre
          <input type="text" maxLength={30} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Campaña 2027/2028" />
        </label>

        <div className="campo-fila">
          <label>
            Fecha de inicio
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label>
            Fecha de fin (opcional)
            <input type="date" value={fin} onChange={(e) => setFin(e.target.value)} />
          </label>
        </div>

        <Pie error={error} enviando={enviando} texto={inicial ? 'Guardar cambios' : 'Guardar campaña'} />
      </form>
    </>
  )
}

/* ---------- Pantalla de campañas ---------- */
type CampaniasProps = {
  esAdmin: boolean
  productos: Producto[]
  setProductos: Dispatch<SetStateAction<Producto[]>>
}

export default function Campanias({ esAdmin, productos, setProductos }: CampaniasProps) {
  const [campanias, setCampanias] = useState<Campania[]>([])
  const [datos, setDatos] = useState<Datos>({ campos: [], lotes: [], labores: [], riegos: [], aplicaciones: [], ordenes: [], cosechas: [] })
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)
  const [antiguasAbiertas, setAntiguasAbiertas] = useState(false)
  const [campaniaNombre, setCampaniaNombre] = useState<string | null>(null)
  const [campoNombre, setCampoNombre] = useState<string | null>(null)
  const [loteNombre, setLoteNombre] = useState<string | null>(null)
  const [seccion, setSeccion] = useState<Seccion | null>(null)
  const [agregando, setAgregando] = useState(false)

  const actuales = campanias.filter(esActual)
  const antiguas = campanias.filter((c) => !esActual(c))
  const camposDe = (nombre: string) => datos.campos.filter((k) => k.nombre_campania === nombre)
  const campania = campanias.find((c) => c.nombre === campaniaNombre)
  const campo = campania && camposDe(campania.nombre).find((k) => k.nombre === campoNombre)
  const lotesDe = (nombreCampo: string) => datos.lotes.filter((l) => l.nombre_campo === nombreCampo)
  const lote = campo && lotesDe(campo.nombre).find((l) => l.nombre === loteNombre)

  // Carga inicial desde la API (y al tocar "Reintentar")
  useEffect(() => {
    let activo = true
    setCargando(true)
    setErrorCarga('')
    svc
      .cargarTodo()
      .then((r) => {
        if (!activo) return
        setCampanias(r.campanias)
        setDatos(r.datos)
      })
      .catch((e: Error) => activo && setErrorCarga(e.message))
      .finally(() => activo && setCargando(false))
    return () => {
      activo = false
    }
  }, [intento])

  // Después de editar o borrar algo con nombre (campaña, campo, lote) se vuelve a pedir todo:
  // los nombres enlazan a los registros y el backend es el que sabe qué cambió.
  const recargar = async (despues?: () => void) => {
    try {
      const r = await svc.cargarTodo()
      setCampanias(r.campanias)
      setDatos(r.datos)
    } catch {
      /* si falla, queda lo que había y se actualiza al recargar la página */
    }
    despues?.()
  }

  const guardar = async (nueva: Omit<Campania, 'id_campania'>) => {
    const creada = await svc.crearCampania(nueva)
    setCampanias((prev) => [creada, ...prev])
    if (creada.fecha_fin && creada.fecha_fin < hoy()) setAntiguasAbiertas(true)
    setAgregando(false)
  }

  if (cargando) return <p className="aviso centrado">Cargando…</p>

  if (errorCarga) {
    return (
      <section>
        <p className="aviso centrado">No se pudieron cargar los datos: {errorCarga}</p>
        <div className="acciones-centro">
          <button type="button" className="agregar" onClick={() => setIntento((i) => i + 1)}>Reintentar</button>
        </div>
      </section>
    )
  }

  if (lote && seccion) {
    return (
      <DetalleSeccion
        lote={lote}
        seccion={seccion}
        datos={datos}
        setDatos={setDatos}
        productos={productos}
        setProductos={setProductos}
        esAdmin={esAdmin}
        onVolver={() => setSeccion(null)}
      />
    )
  }

  if (lote) {
    return (
      <DetalleLote
        lote={lote}
        datos={datos}
        nombresLotes={lotesDe(lote.nombre_campo).map((l) => l.nombre)}
        esAdmin={esAdmin}
        onEditar={async (x) => {
          await svc.editarLote(lote.nombre_campo, lote.nombre, x)
          await recargar(() => setLoteNombre(x.nombre))
        }}
        onEliminar={async () => {
          await svc.eliminarLote(lote.nombre_campo, lote.nombre)
          await recargar(() => setLoteNombre(null))
        }}
        onVolver={() => setLoteNombre(null)}
        onAbrirSeccion={setSeccion}
      />
    )
  }

  if (campania && campo) {
    return (
      <DetalleCampo
        campo={campo}
        lotes={lotesDe(campo.nombre)}
        nombresCampos={datos.campos.map((k) => k.nombre)}
        esAdmin={esAdmin}
        onEditar={async (x) => {
          await svc.editarCampo(campo.nombre, campo.nombre_campania, x)
          await recargar(() => setCampoNombre(x.nombre))
        }}
        onEliminar={async () => {
          await svc.eliminarCampo(campo.nombre)
          await recargar(() => setCampoNombre(null))
        }}
        onGuardarLote={async (nuevo) => {
          const creado = await svc.crearLote(campo.nombre, nuevo)
          setDatos((d) => ({ ...d, lotes: [...d.lotes, creado] }))
        }}
        onVolver={() => setCampoNombre(null)}
        onAbrirLote={setLoteNombre}
      />
    )
  }

  if (campania) {
    return (
      <DetalleCampania
        c={campania}
        campos={camposDe(campania.nombre)}
        nombresCampos={datos.campos.map((k) => k.nombre)}
        nombresCampanias={campanias.map((c) => c.nombre)}
        esAdmin={esAdmin}
        onEditar={async (x) => {
          await svc.editarCampania(campania.nombre, x)
          await recargar(() => setCampaniaNombre(x.nombre))
        }}
        onEliminar={async () => {
          await svc.eliminarCampania(campania.nombre)
          await recargar(() => setCampaniaNombre(null))
        }}
        onGuardarCampo={async (nuevo) => {
          const creado = await svc.crearCampo(campania.nombre, nuevo)
          setDatos((d) => ({ ...d, campos: [...d.campos, creado] }))
        }}
        onVolver={() => setCampaniaNombre(null)}
        onAbrirCampo={setCampoNombre}
      />
    )
  }

  const cuadro = (c: Campania) => (
    <Cuadro key={c.id_campania} c={c} campos={camposDe(c.nombre).length} onAbrir={() => setCampaniaNombre(c.nombre)} />
  )

  return (
    <section>
      <div className="campanias-cabecera">
        <div>
          <p className="etiqueta">Sección</p>
          <h2 className="titulo">Campañas</h2>
        </div>
        {esAdmin && (
          <button type="button" className="agregar" onClick={() => setAgregando(true)}>
            + Agregar campaña
          </button>
        )}
      </div>

      <h3 className="subtitulo">Actuales</h3>
      {actuales.length > 0 ? (
        <div className="campanias-grilla">{actuales.map(cuadro)}</div>
      ) : (
        <p className="aviso">No hay campañas actuales.</p>
      )}

      <button
        type="button"
        className="desplegable"
        onClick={() => setAntiguasAbiertas((v) => !v)}
        aria-expanded={antiguasAbiertas}
      >
        <span>Campañas antiguas</span>
        <span className="desplegable-cuenta">{antiguas.length}</span>
        <span className={antiguasAbiertas ? 'flecha abierta' : 'flecha'} />
      </button>

      {antiguasAbiertas &&
        (antiguas.length > 0 ? (
          <div className="campanias-grilla antiguas">{antiguas.map(cuadro)}</div>
        ) : (
          <p className="aviso">No hay campañas antiguas.</p>
        ))}

      {agregando && (
        <Modal titulo="Agregar campaña" onCerrar={() => setAgregando(false)}>
          <Formulario existentes={campanias.map((c) => c.nombre)} onGuardar={guardar} />
        </Modal>
      )}
    </section>
  )
}
