// URL base de tu backend Spring Boot (ajustada al puerto configurado en tu servidor)
const API_URL = "https://inventario-backend-production-e240.up.railway.app/productos";

let productos = [];
let idEditando = null;

// =========================================================================
// PARTE 1: CONSULTAR PRODUCTOS (GET - Páginas 194-196)
// =========================================================================
async function cargarProductos() {
    const tabla = document.getElementById("tablaProductos");
    
    // Si no existe la tabla en esta página, detenemos la función sin romper el script
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
// PARTE 2: REGISTRAR (POST) Y MODIFICAR (PUT) (Páginas 196-197)
// =========================================================================
const formProducto = document.getElementById("formProducto");
const btnGuardar = document.getElementById("btnGuardar");
const formTitulo = document.getElementById("formTitulo");

if (formProducto) {
    formProducto.addEventListener("submit", async function (event) {
        event.preventDefault();

        const codigo = document.getElementById("codigo").value.trim();
        const nombre = document.getElementById("nombre").value.trim();
        const marca = document.getElementById("marca").value.trim();
        const categoria = document.getElementById("categoria").value;
        const precio = parseFloat(document.getElementById("precio").value);
        const cantidad = parseInt(document.getElementById("cantidad").value);

        if (precio <= 0 || cantidad < 0) {
            alert("El precio debe ser mayor a 0 y la cantidad no puede ser negativa.");
            return;
        }

        const producto = { codigo: document.getElementById("codigo").value,     nombre: document.getElementById("nombre").value,     categoria: document.getElementById("categoria").value,     precio: document.getElementById("precio").value,     cantidad: document.getElementById("cantidad").value  };

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
                    formProducto.reset();
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
                    cancelarEdicion();
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
    document.getElementById("codigo").value = prod.codigo;
    document.getElementById("nombre").value = prod.nombre;
    document.getElementById("categoria").value = prod.categoria;
    document.getElementById("precio").value = prod.precio;
    document.getElementById("cantidad").value = prod.cantidad;
    document.getElementById("marca").value = prod.marca || "";

    if (btnGuardar) {
        btnGuardar.innerHTML = `<i class="fa-solid fa-check me-1"></i>Actualizar Producto`;
        btnGuardar.className = "btn btn-success fw-semibold";
    }
    if (formTitulo) {
        formTitulo.innerHTML = `<i class="fa-solid fa-pen-to-square me-2"></i>Modificar Producto (${prod.codigo})`;
    }
};

window.cancelarEdicion = function () {
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

// =========================================================================
// PARTE 3: ELIMINAR PRODUCTOS (DELETE - Página 198)
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

// Ejecución inicial para pintar la tabla desde MySQL
cargarProductos();
// =========================================================================
// BUSCAR PRODUCTO POR ID (GET /productos/{id})
// =========================================================================
async function buscarProductoPorId() {
    const inputId = document.getElementById("buscarId");
    const id = inputId.value.trim();

    if (!id) {
        alert("Por favor ingresa un ID para buscar.");
        return;
    }

    try {
        // Hace la petición al endpoint con PathVariable de Spring Boot
        const respuesta = await fetch(`${API_URL}/${id}`);

        if (!respuesta.ok) {
            alert(`No se encontró ningún producto con el ID ${id}`);
            return;
        }

        const producto = await respuesta.json();
        const tabla = document.getElementById("tablaProductos");
        if (!tabla) return;

        // Si el endpoint devuelve null o un objeto vacío
        if (!producto || !producto.id) {
            alert(`No se encontró ningún producto con el ID ${id}`);
            return;
        }

        // Renderiza únicamente el producto encontrado en la tabla
        tabla.innerHTML = `
            <tr>
                <td>${producto.id}</td>
                <td class="fw-bold">${producto.codigo}</td>
                <td>${producto.nombre}</td>
                <td><span class="badge bg-secondary">${producto.categoria || 'N/A'}</span></td>
                <td class="text-success fw-bold">$${Number(producto.precio).toLocaleString()}</td>
                <td>${producto.marca || 'N/A'}</td>
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
    cargarProductos(); // Vuelve a listar todos los productos de MySQL
}