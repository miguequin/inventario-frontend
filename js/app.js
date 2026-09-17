const API_URL = "https://inventario-backend-production-e240.up.railway.app/productos";

let productos = [];
let idEditando = null;

// =========================================================================
// PARTE 1: CONSULTAR PRODUCTOS (GET)
// =========================================================================
async function cargarProductos() {
    const tabla = document.getElementById("tablaProductos");
    if (!tabla) return;

    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error("Error al consultar la API");

        productos = await respuesta.json();
        tabla.innerHTML = "";

        productos.forEach(producto => {
            tabla.innerHTML += `
                <tr>
                    <td>${producto.id}</td>
                    <td class="fw-bold">${producto.codigo}</td>
                    <td>${producto.nombre}</td>
                    <td><span class="badge bg-secondary">${producto.categoria || 'N/A'}</span></td>
                    <td>${producto.marca || 'N/A'}</td>
                    <td>${producto.proveedor || 'N/A'}</td>
                    <td class="text-success fw-bold">$${Number(producto.precio).toLocaleString()}</td>
                    <td class="text-center">
                        <span class="badge ${producto.cantidad > 5 ? 'bg-success' : (producto.cantidad > 0 ? 'bg-warning text-dark' : 'bg-danger')}">
                            ${producto.cantidad}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-1" onclick="iniciarEdicion(${producto.id})">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${producto.id}, '${producto.codigo}')">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

        calcularTotalInventario();
    } catch (error) {
        console.error("ERROR AL CONSULTAR LA API:", error);
    }
}

// Cálculo del total general del inventario
function calcularTotalInventario() {
    const totalGeneral = document.getElementById("totalGeneral");
    if (!totalGeneral) return;
    const total = productos.reduce((acumulado, prod) => acumulado + (Number(prod.precio) * Number(prod.cantidad)), 0);
    totalGeneral.textContent = `Valor Total Inventario: $${total.toLocaleString()}`;
}

// =========================================================================
// PARTE 2: REGISTRAR (POST) Y MODIFICAR (PUT)
// =========================================================================
const formProducto = document.getElementById("formProducto");
const btnGuardar = document.getElementById("btnGuardar");
const formTitulo = document.getElementById("formTitulo");

if (formProducto) {
    formProducto.addEventListener("submit", async function (event) {
        event.preventDefault();

        const codigo = document.getElementById("codigo").value.trim();
        const nombre = document.getElementById("nombre").value.trim();
        const categoria = document.getElementById("categoria").value;
        const marca = document.getElementById("marca").value.trim();
        const proveedor = document.getElementById("proveedor").value.trim();
        const precio = parseFloat(document.getElementById("precio").value);
        const cantidad = parseInt(document.getElementById("cantidad").value);
        const stockMinimoInput = document.getElementById("stockMinimo");
        const stockMinimo = stockMinimoInput ? parseInt(stockMinimoInput.value) : 1;

        if (precio <= 0 || cantidad < 0) {
            alert("El precio debe ser mayor a 0 y la cantidad no puede ser negativa.");
            return;
        }

        // Se incluyen marca y proveedor correctamente en el objeto JSON
        const producto = {
            codigo: codigo,
            nombre: nombre,
            categoria: categoria,
            marca: marca,
            proveedor: proveedor,
            precio: precio,
            cantidad: cantidad,
            stockMinimo: stockMinimo
        };

        try {
            if (idEditando === null) {
                // REGISTRAR: POST /productos
                const respuesta = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(producto)
                });

                if (respuesta.ok) {
                    alert("Producto registrado correctamente");
                    limpiarFormulario();
                    cargarProductos();
                } else {
                    alert("No fue posible registrar el producto");
                }
            } else {
                // MODIFICAR: PUT /productos/{id}
                const respuesta = await fetch(`${API_URL}/${idEditando}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(producto)
                });

                if (respuesta.ok) {
                    alert("Producto actualizado correctamente");
                    limpiarFormulario();
                    cargarProductos();
                } else {
                    alert("No fue posible actualizar el producto");
                }
            }
        } catch (error) {
            console.error("Error en la conexión:", error);
            alert("No se pudo conectar con el servidor backend");
        }
    });
}

// Cargar datos en el formulario para editar
window.iniciarEdicion = function (id) {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;

    idEditando = prod.id;
    document.getElementById("codigo").value = prod.codigo || "";
    document.getElementById("nombre").value = prod.nombre || "";
    document.getElementById("categoria").value = prod.categoria || "";
    document.getElementById("marca").value = prod.marca || "";
    document.getElementById("proveedor").value = prod.proveedor || "";
    document.getElementById("precio").value = prod.precio || 0;
    document.getElementById("cantidad").value = prod.cantidad || 0;

    const stockMin = document.getElementById("stockMinimo");
    if (stockMin) stockMin.value = prod.stockMinimo || 1;

    if (btnGuardar) {
        btnGuardar.innerHTML = `<i class="fa-solid fa-check me-1"></i>Actualizar Producto`;
        btnGuardar.className = "btn btn-success fw-semibold";
    }
    if (formTitulo) {
        formTitulo.innerHTML = `<i class="fa-solid fa-pen-to-square me-2"></i>Modificar Producto (${prod.codigo})`;
    }

    // Llevar la vista hacia el formulario suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Función para limpiar/cancelar edición
window.limpiarFormulario = function () {
    idEditando = null;
    if (formProducto) formProducto.reset();
    if (btnGuardar) {
        btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk me-1"></i>Guardar Producto`;
        btnGuardar.className = "btn btn-primary fw-semibold";
    }
    if (formTitulo) {
        formTitulo.innerHTML = `<i class="fa-solid fa-pen-to-square me-2"></i>Registrar Producto`;
    }
};

window.cancelarEdicion = window.limpiarFormulario;

// =========================================================================
// PARTE 3: ELIMINAR PRODUCTOS (DELETE)
// =========================================================================
window.eliminarProducto = async function (id, codigo) {
    const confirmar = confirm(`¿Está seguro de eliminar este producto (${codigo})?`);
    if (!confirmar) return;

    try {
        const respuesta = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        if (respuesta.ok) {
            alert("Producto eliminado correctamente");
            cargarProductos();
        } else {
            alert("No fue posible eliminar el producto");
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo conectar con el servidor backend");
    }
};

// =========================================================================
// BUSCAR PRODUCTO POR ID (GET /productos/{id})
// =========================================================================
async function buscarProductoPorId() {
    const inputId = document.getElementById("buscarId");
    if (!inputId) return;
    const id = inputId.value.trim();

    if (!id) {
        alert("Por favor ingresa un ID para buscar.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/${id}`);

        if (!respuesta.ok) {
            alert(`No se encontró ningún producto con el ID ${id}`);
            return;
        }

        const producto = await respuesta.json();
        const tabla = document.getElementById("tablaProductos");
        if (!tabla) return;

        if (!producto || !producto.id) {
            alert(`No se encontró ningún producto con el ID ${id}`);
            return;
        }

        tabla.innerHTML = `
            <tr>
                <td>${producto.id}</td>
                <td class="fw-bold">${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td><span class="badge bg-secondary">${producto.categoria || 'N/A'}</span></td>
                <td>${producto.marca || 'N/A'}</td>
                <td>${producto.proveedor || 'N/A'}</td>
                <td class="text-success fw-bold">$${Number(producto.precio).toLocaleString()}</td>
                <td class="text-center">
                    <span class="badge ${producto.cantidad > 5 ? 'bg-success' : (producto.cantidad > 0 ? 'bg-warning text-dark' : 'bg-danger')}">
                        ${producto.cantidad}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm me-1" onclick="iniciarEdicion(${producto.id})">
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${producto.id}, '${producto.codigo}')">
                        <i class="fa-solid fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>
        `;
    } catch (error) {
        console.error("Error al buscar producto:", error);
        alert("Ocurrió un error al consultar el producto.");
    }
}

function limpiarBusqueda() {
    const inputId = document.getElementById("buscarId");
    if (inputId) inputId.value = "";
    cargarProductos();
}
// =========================================================================
// BUSCAR PRODUCTOS POR NOMBRE (GET /productos/buscar/{nombre})
// =========================================================================
async function buscarProductosPorNombre() {
    const input = document.getElementById("inputBuscarNombre");
    if (!input) return;

    const nombre = input.value.trim();

    // Si la caja está vacía, recarga todos los productos
    if (!nombre) {
        cargarProductos();
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/buscar/${encodeURIComponent(nombre)}`);

        if (!respuesta.ok) {
            throw new Error(`Error en la consulta: ${respuesta.status}`);
        }

        const productosEncontrados = await respuesta.json();
        
        // Buscamos la tabla con cualquiera de sus IDs posibles
        const tabla = document.getElementById("tablaProductos") || document.getElementById("cuerpo-tabla");
        if (!tabla) return;

        tabla.innerHTML = "";

        // Si no hubo coincidencias
        if (productosEncontrados.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center text-muted py-3">
                        <i class="fa-solid fa-circle-exclamation me-1"></i>
                        No se encontraron productos que coincidan con "<strong>${nombre}</strong>".
                    </td>
                </tr>
            `;
            return;
        }

        // Pinta únicamente los productos encontrados
        productosEncontrados.forEach(producto => {
            tabla.innerHTML += `
                <tr>
                    <td>${producto.id}</td>
                    <td class="fw-bold">${producto.codigo || ''}</td>
                    <td>${producto.nombre || ''}</td>
                    <td><span class="badge bg-secondary">${producto.categoria || 'N/A'}</span></td>
                    <td>${producto.marca || 'N/A'}</td>
                    <td>${producto.proveedor || 'N/A'}</td>
                    <td class="text-success fw-bold">$${Number(producto.precio || 0).toLocaleString()}</td>
                    <td class="text-center">
                        <span class="badge ${producto.cantidad > 5 ? 'bg-success' : (producto.cantidad > 0 ? 'bg-warning text-dark' : 'bg-danger')}">
                            ${producto.cantidad || 0}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-1" onclick="iniciarEdicion(${producto.id})">
                            <i class="fa-solid fa-pen"></i> Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${producto.id}, '${producto.codigo}')">
                            <i class="fa-solid fa-trash"></i> Eliminar
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error al buscar productos por nombre:", error);
        alert("Ocurrió un error al buscar los productos.");
    }
}

// Limpia el input de búsqueda y vuelve a mostrar la lista completa
function limpiarBusquedaNombre() {
    const input = document.getElementById("inputBuscarNombre");
    if (input) input.value = "";
    cargarProductos();
}
// =========================================================================
// MOSTRAR TOTAL DE PRODUCTOS EN PÁGINA PRINCIPAL (GET /productos)
// =========================================================================
async function mostrarTotalProductosInicio() {
    const contadorElemento = document.getElementById("contadorTotalProductos");
    
    // Si no estamos en la página principal o no existe este elemento, salimos
    if (!contadorElemento) return;

    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error("Error al consultar productos");

        const productos = await respuesta.json();
        
        // La cantidad total es la longitud del arreglo devuelto por MySQL
        contadorElemento.textContent = productos.length;
    } catch (error) {
        console.error("Error al obtener total de productos:", error);
        contadorElemento.textContent = "0";
    }
}

// Ejecutar cuando cargue el documento
document.addEventListener("DOMContentLoaded", () => {
    mostrarTotalProductosInicio();
});
// Ejecución inicial para cargar los productos al abrir la página
cargarProductos();
