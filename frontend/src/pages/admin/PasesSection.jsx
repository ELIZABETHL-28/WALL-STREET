import { useEffect, useState } from 'react';
import {
    getTiposPaseAdmin,
    crearTipoPase,
    editarTipoPase,
    cambiarEstadoTipoPase,
    getPasesAdquiridosAdmin,
} from '../../services/pase.service';

const FORM_INICIAL = {
    nombre: '',
    descripcion: '',
    precio: '0',
    cantidadMaximaPersonas: '1',
    serviciosIncluidos: '',
    estado: 'ACTIVO',
};

function formatFecha(valor) {
    if (!valor) return '—';
    return String(valor).split('T')[0];
}

function formatMoneda(valor) {
    return `Q ${Number(valor || 0).toFixed(2)}`;
}

export default function PasesSection() {
    const [tipos, setTipos] = useState([]);
    const [pases, setPases] = useState([]);
    const [form, setForm] = useState(FORM_INICIAL);
    const [editandoId, setEditandoId] = useState(null);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const cargar = async () => {
        setLoading(true);
        setError('');
        try {
            const [tiposData, pasesData] = await Promise.all([
                getTiposPaseAdmin(),
                getPasesAdquiridosAdmin(),
            ]);
            setTipos(tiposData.tipos || []);
            setPases(pasesData.pases || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const flash = (mensaje) => {
        setSuccess(mensaje);
        window.setTimeout(() => setSuccess(''), 3000);
    };

    const nuevo = () => {
        setEditandoId(null);
        setForm(FORM_INICIAL);
        setMostrarForm(true);
        setError('');
    };

    const editar = (tipo) => {
        setEditandoId(tipo.id_tipo_pase);
        setForm({
            nombre: tipo.nombre || '',
            descripcion: tipo.descripcion || '',
            precio: String(tipo.precio ?? 0),
            cantidadMaximaPersonas: String(tipo.cantidad_maxima_personas ?? 1),
            serviciosIncluidos: tipo.servicios_incluidos || '',
            estado: tipo.estado || 'ACTIVO',
        });
        setMostrarForm(true);
        setError('');
    };

    const handleChange = (e) => {
        setForm((actual) => ({
            ...actual,
            [e.target.name]: e.target.value,
        }));
    };

    const guardar = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setError('');

        const payload = {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            precio: Number(form.precio),
            cantidadMaximaPersonas: Number(form.cantidadMaximaPersonas),
            serviciosIncluidos: form.serviciosIncluidos.trim() || null,
            estado: form.estado,
        };

        try {
            if (editandoId) {
                await editarTipoPase(editandoId, payload);
                flash('Tipo de pase actualizado.');
            } else {
                await crearTipoPase(payload);
                flash('Tipo de pase creado.');
            }

            setMostrarForm(false);
            setEditandoId(null);
            setForm(FORM_INICIAL);
            await cargar();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardando(false);
        }
    };

    const cambiarEstado = async (id, estado) => {
        setError('');
        try {
            await cambiarEstadoTipoPase(id, estado);
            flash('Estado actualizado.');
            await cargar();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <p className="admin-loading">Cargando pases...</p>;
    }

    return (
        <div>
            <div className="admin-section-header">
                <h2 className="admin-section-title">Pases de Día</h2>
                <button className="btn-new" onClick={nuevo}>
                    + Nuevo tipo de pase
                </button>
            </div>

            {error && <div className="admin-error">{error}</div>}
            {success && <div className="admin-success">{success}</div>}

            {mostrarForm && (
                <form
                    onSubmit={guardar}
                    style={{
                        background: '#111',
                        border: '1px solid #1e1e1e',
                        borderRadius: 12,
                        padding: '1.25rem',
                        maxWidth: 760,
                        marginBottom: '1.5rem',
                    }}
                >
                    <h3 style={{ color: '#f0f0f0', marginBottom: '1rem' }}>
                        {editandoId ? 'Editar tipo de pase' : 'Nuevo tipo de pase'}
                    </h3>

                    <div className="form-field">
                        <label htmlFor="pase-nombre">Nombre</label>
                        <input
                            id="pase-nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            maxLength="120"
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="pase-descripcion">Descripción</label>
                        <textarea
                            id="pase-descripcion"
                            name="descripcion"
                            value={form.descripcion}
                            onChange={handleChange}
                            rows="3"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-field">
                            <label htmlFor="pase-precio">Precio</label>
                            <input
                                id="pase-precio"
                                name="precio"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.precio}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="pase-personas">Máximo de personas</label>
                            <input
                                id="pase-personas"
                                name="cantidadMaximaPersonas"
                                type="number"
                                min="1"
                                value={form.cantidadMaximaPersonas}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="pase-servicios">Servicios incluidos</label>
                            <input
                                id="pase-servicios"
                                name="serviciosIncluidos"
                                value={form.serviciosIncluidos}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="pase-estado">Estado</label>
                            <select
                                id="pase-estado"
                                name="estado"
                                value={form.estado}
                                onChange={handleChange}
                            >
                                <option value="ACTIVO">ACTIVO</option>
                                <option value="INACTIVO">INACTIVO</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem' }}>
                        <button className="btn-save" type="submit" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            className="btn-cancel"
                            type="button"
                            onClick={() => setMostrarForm(false)}
                            disabled={guardando}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            <h3 style={{ color: '#f0f0f0', marginBottom: '1rem' }}>
                Tipos de pase
            </h3>

            <div className="admin-table-wrap" style={{ marginBottom: '2rem' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Precio</th>
                            <th>Máx. personas</th>
                            <th>Servicios</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {tipos.map((tipo) => (
                            <tr key={tipo.id_tipo_pase}>
                                <td>
                                    <strong>{tipo.nombre}</strong>
                                    <div className="muted" style={{ fontSize: '.72rem' }}>
                                        {tipo.descripcion || 'Sin descripción'}
                                    </div>
                                </td>
                                <td>{formatMoneda(tipo.precio)}</td>
                                <td>{tipo.cantidad_maxima_personas}</td>
                                <td className="muted">{tipo.servicios_incluidos || '—'}</td>
                                <td>
                                    <select
                                        value={tipo.estado}
                                        onChange={(e) =>
                                            cambiarEstado(tipo.id_tipo_pase, e.target.value)
                                        }
                                    >
                                        <option value="ACTIVO">ACTIVO</option>
                                        <option value="INACTIVO">INACTIVO</option>
                                    </select>
                                </td>
                                <td>
                                    <button className="btn-icon" onClick={() => editar(tipo)}>
                                        Editar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3 style={{ color: '#f0f0f0', marginBottom: '1rem' }}>
                Pases adquiridos
            </h3>

            {pases.length === 0 ? (
                <p className="muted">Todavía no hay pases adquiridos.</p>
            ) : (
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Cliente</th>
                                <th>Tipo</th>
                                <th>Fecha de uso</th>
                                <th>Personas</th>
                                <th>Precio</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pases.map((pase) => (
                                <tr key={pase.id_pase_cliente}>
                                    <td>{pase.codigo_pase}</td>
                                    <td>{pase.cliente_nombres} {pase.cliente_apellidos}</td>
                                    <td>{pase.tipo_pase_nombre}</td>
                                    <td className="muted">{formatFecha(pase.fecha_uso)}</td>
                                    <td>{pase.cantidad_personas}</td>
                                    <td>{formatMoneda(pase.precio_aplicado)}</td>
                                    <td>{pase.estado}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
