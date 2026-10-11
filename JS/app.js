'use strict';

// AutoMax: gestión de vehículos usando LocalStorage, sin base de datos externa.
const STORAGE_KEY = 'automax_vehiculos_v1';
const form = document.getElementById('vehicle-form');
const vehicleList = document.getElementById('vehicle-list');
const vehicleCount = document.getElementById('vehicle-count');
const searchInput = document.getElementById('buscar-vehiculo');
const submitButton = document.getElementById('btn-registrar');
const clearButton = document.getElementById('btn-limpiar');
const editingIdInput = document.getElementById('vehicle-id');
const yearInput = document.getElementById('anio');
const footerYear = document.getElementById('footer-year');
const imageInput = document.getElementById('imagen');
const imageUrlInput = document.getElementById('imagen-url');
const imagePreviewWrap = document.getElementById('image-preview-wrap');
const imagePreview = document.getElementById('image-preview');
const removeImageButton = document.getElementById('remove-image');
const catalog = document.getElementById('vehicle-catalog');
const catalogCount = document.getElementById('catalog-count');
let selectedImageData = '';
let selectedImageUrl = '';
let editingOriginalImage = '';

const fields = {
  codigo: document.getElementById('codigo'),
  marca: document.getElementById('marca'),
  modelo: document.getElementById('modelo'),
  anio: yearInput,
  color: document.getElementById('color'),
  combustible: document.getElementById('combustible'),
  transmision: document.getElementById('transmision'),
  precio: document.getElementById('precio'),
  cantidad: document.getElementById('cantidad'),
  descripcion: document.getElementById('descripcion')
};

let vehicles = loadVehicles();

function loadVehicles() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('No se pudieron recuperar los vehículos:', error);
    alert('No se pudieron leer los datos guardados en este navegador.');
    return [];
  }
}

function saveVehicles() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    return true;
  } catch (error) {
    console.error('No se pudieron guardar los vehículos:', error);
    alert('No fue posible guardar los datos. Revisa el espacio disponible del navegador.');
    return false;
  }
}

function normalizeCode(value) {
  return value.trim().toUpperCase();
}

function readForm() {
  return {
    codigo: normalizeCode(fields.codigo.value),
    marca: fields.marca.value.trim(),
    modelo: fields.modelo.value.trim(),
    anio: Number(fields.anio.value),
    color: fields.color.value.trim(),
    combustible: fields.combustible.value,
    precio: Number(fields.precio.value),
    cantidad: Number(fields.cantidad.value),
    transmision: fields.transmision.value,
    descripcion: fields.descripcion.value.trim(),
    imagen: selectedImageUrl || selectedImageData || editingOriginalImage || ''
  };
}

function validateVehicle(vehicle, currentId = '') {
  const requiredKeys = ['codigo', 'marca', 'modelo', 'anio', 'color', 'combustible', 'precio', 'cantidad', 'transmision', 'descripcion'];
  for (const key of requiredKeys) {
    const value = vehicle[key];
    if (value === '' || value === null || value === undefined ||
        (typeof value === 'number' && !Number.isFinite(value))) {
      alert('Todos los campos obligatorios deben completarse. Revisa: ' + key + '.');
      fields[key]?.focus();
      return false;
    }
  }

  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(vehicle.anio) || vehicle.anio < 1886 || vehicle.anio > currentYear + 1) {
    alert(`Introduce un año válido entre 1886 y ${currentYear + 1}.`);
    fields.anio.focus();
    return false;
  }
  if (!(vehicle.precio > 0)) {
    alert('El precio debe ser mayor que cero.');
    fields.precio.focus();
    return false;
  }
  if (!Number.isInteger(vehicle.cantidad) || vehicle.cantidad < 0) {
    alert('La cantidad disponible debe ser un número entero igual o mayor que cero.');
    fields.cantidad.focus();
    return false;
  }

  const duplicate = vehicles.some(item =>
    normalizeCode(item.codigo) === vehicle.codigo && item.id !== currentId
  );
  if (duplicate) {
    alert('Ya existe un vehículo registrado con ese código. Utiliza uno diferente.');
    fields.codigo.focus();
    return false;
  }
  return true;
}

function makeCell(value) {
  const td = document.createElement('td');
  td.textContent = String(value ?? '');
  return td;
}

function formatPrice(price) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency', currency: 'DOP', maximumFractionDigits: 2
  }).format(price);
}

function renderVehicles() {
  const query = searchInput.value.trim().toLocaleLowerCase('es');
  const visibleVehicles = vehicles.filter(vehicle =>
    [vehicle.codigo, vehicle.marca, vehicle.modelo].some(value =>
      String(value).toLocaleLowerCase('es').includes(query)
    )
  );

  vehicleList.replaceChildren();
  vehicleCount.textContent = `${vehicles.length} ${vehicles.length === 1 ? 'vehículo' : 'vehículos'}`;

  if (visibleVehicles.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 10;
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    const title = document.createElement('strong');
    title.textContent = query ? 'No se encontraron vehículos' : 'Aún no hay vehículos registrados';
    const description = document.createElement('span');
    description.textContent = query
      ? 'Prueba con otro código, marca o modelo.'
      : 'Completa el formulario para comenzar a llenar tu inventario.';
    empty.append(title, description);
    cell.append(empty);
    row.append(cell);
    vehicleList.append(row);
    renderCatalog(visibleVehicles);
    return;
  }

  visibleVehicles.forEach(vehicle => {
    const row = document.createElement('tr');
    row.append(
      makeCell(vehicle.codigo), makeCell(vehicle.marca), makeCell(vehicle.modelo),
      makeCell(vehicle.anio), makeCell(vehicle.color), makeCell(vehicle.combustible),
      makeCell(formatPrice(vehicle.precio)), makeCell(vehicle.cantidad),
      makeCell(vehicle.descripcion)
    );

    const actions = document.createElement('td');
    actions.className = 'row-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'button button-secondary button-small';
    editButton.textContent = 'Editar';
    editButton.setAttribute('aria-label', `Editar vehículo ${vehicle.codigo}`);
    editButton.addEventListener('click', () => editVehicle(vehicle.id));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button button-danger button-small';
    deleteButton.textContent = 'Eliminar';
    deleteButton.setAttribute('aria-label', `Eliminar vehículo ${vehicle.codigo}`);
    deleteButton.addEventListener('click', () => deleteVehicle(vehicle.id));
    actions.append(editButton, deleteButton);
    row.append(actions);
    vehicleList.append(row);
  });
  renderCatalog(visibleVehicles);
}


function renderCatalog(visibleVehicles = vehicles) {
  catalog.replaceChildren();
  catalogCount.textContent = `${vehicles.filter(vehicle => Number(vehicle.cantidad) > 0).length} disponibles`;

  if (visibleVehicles.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'catalog-empty';
    const title = document.createElement('strong');
    title.textContent = searchInput.value.trim() ? 'No hay vehículos que coincidan' : 'Tu catálogo está esperando vehículos';
    const detail = document.createElement('span');
    detail.textContent = searchInput.value.trim()
      ? 'Prueba con otro código, marca o modelo.'
      : 'Registra un vehículo y agrega una fotografía para mostrarlo aquí.';
    empty.append(title, detail);
    if (!searchInput.value.trim()) {
      const link = document.createElement('a');
      link.href = '#registro';
      link.className = 'button button-primary';
      link.textContent = 'Agregar vehículo';
      empty.append(link);
    }
    catalog.append(empty);
    return;
  }

  visibleVehicles.forEach(vehicle => {
    const card = document.createElement('article');
    card.className = 'vehicle-card';
    const imageArea = document.createElement('div');
    imageArea.className = 'vehicle-card-image';
    if (vehicle.imagen) {
      const img = document.createElement('img');
      img.src = vehicle.imagen;
      img.alt = `${vehicle.marca} ${vehicle.modelo}`;
      img.loading = 'lazy';
      img.onerror = () => {
        img.remove();
        imageArea.append(makeImagePlaceholder());
      };
      imageArea.append(img);
    } else {
      imageArea.append(makeImagePlaceholder());
    }
    const code = document.createElement('span');
    code.className = 'vehicle-code';
    code.textContent = vehicle.codigo;
    imageArea.append(code);

    const body = document.createElement('div');
    body.className = 'vehicle-card-body';
    const brand = document.createElement('p');
    brand.className = 'vehicle-card-brand';
    brand.textContent = vehicle.marca;
    const title = document.createElement('h3');
    title.textContent = vehicle.modelo;
    const year = document.createElement('p');
    year.className = 'vehicle-card-year';
    year.textContent = `Año ${vehicle.anio} · ${vehicle.transmision}`;
    const price = document.createElement('p');
    price.className = 'vehicle-card-price';
    price.textContent = formatPrice(vehicle.precio);

    const specs = document.createElement('div');
    specs.className = 'vehicle-specs';
    [['Color', vehicle.color], ['Combustible', vehicle.combustible], ['Disponibles', vehicle.cantidad], ['Código', vehicle.codigo]].forEach(([label, value]) => {
      const spec = document.createElement('div');
      spec.className = 'vehicle-spec';
      const labelNode = document.createElement('span');
      labelNode.textContent = label;
      const strong = document.createElement('strong');
      strong.textContent = String(value);
      spec.append(labelNode, strong);
      specs.append(spec);
    });
    const description = document.createElement('p');
    description.className = 'vehicle-card-description';
    description.textContent = vehicle.descripcion || 'Sin descripción adicional.';
    const bottom = document.createElement('div');
    bottom.className = 'vehicle-card-bottom';
    const stock = document.createElement('span');
    stock.className = 'stock-label';
    stock.textContent = Number(vehicle.cantidad) > 0 ? 'Disponible' : 'Agotado';
    if (Number(vehicle.cantidad) <= 0) {
      stock.style.background = '#fff0f0';
      stock.style.color = '#b42335';
    }
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'button button-secondary button-small';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => editVehicle(vehicle.id));
    bottom.append(stock, edit);
    body.append(brand, title, year, price, specs, description, bottom);
    card.append(imageArea, body);
    catalog.append(card);
  });
}

function makeImagePlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'vehicle-image-placeholder';
  placeholder.innerHTML = '<svg viewBox="0 0 120 70" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 44l8-20c2-5 6-8 12-8h47c6 0 10 3 13 8l8 20"/><path d="M9 43h102v13H9z"/><circle cx="29" cy="57" r="8" fill="#f7f9fc"/><circle cx="91" cy="57" r="8" fill="#f7f9fc"/><path d="M35 18l-7 23m57-23l7 23"/></svg>';
  const text = document.createElement('span');
  text.textContent = 'Imagen no disponible';
  placeholder.append(text);
  return placeholder;
}

function showImagePreview(dataUrl) {
  if (!dataUrl) {
    imagePreviewWrap.hidden = true;
    imagePreview.removeAttribute('src');
    return;
  }
  imagePreview.src = dataUrl;
  imagePreviewWrap.hidden = false;
}

function resetFormState() {
  form.reset();
  selectedImageData = '';
  selectedImageUrl = '';
  editingOriginalImage = '';
  showImagePreview('');
  imageInput.value = '';
  imageUrlInput.value = '';
  editingIdInput.value = '';
  submitButton.textContent = 'Registrar vehículo';
  document.querySelector('#registro h2').textContent = 'Datos del vehículo';
  yearInput.max = String(new Date().getFullYear() + 1);
}

function editVehicle(id) {
  const vehicle = vehicles.find(item => item.id === id);
  if (!vehicle) return;

  editingIdInput.value = vehicle.id;
  for (const key of Object.keys(fields)) fields[key].value = vehicle[key] ?? '';
  editingOriginalImage = vehicle.imagen || '';
  selectedImageData = '';
  selectedImageUrl = /^https?:\/\//i.test(editingOriginalImage) ? editingOriginalImage : '';
  imageUrlInput.value = selectedImageUrl;
  imageInput.value = '';
  showImagePreview(editingOriginalImage);
  submitButton.textContent = 'Guardar cambios';
  document.querySelector('#registro h2').textContent = `Editar vehículo ${vehicle.codigo}`;
  document.getElementById('registro').scrollIntoView({ behavior: 'smooth' });
  fields.codigo.focus({ preventScroll: true });
}

function deleteVehicle(id) {
  const vehicle = vehicles.find(item => item.id === id);
  if (!vehicle) return;
  if (!confirm(`¿Seguro que deseas eliminar el vehículo ${vehicle.codigo}?`)) return;

  const previousVehicles = vehicles;
  vehicles = vehicles.filter(item => item.id !== id);
  if (!saveVehicles()) {
    vehicles = previousVehicles;
    return;
  }
  if (editingIdInput.value === id) resetFormState();
  renderVehicles();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const vehicle = readForm();
  const currentId = editingIdInput.value;
  if (!validateVehicle(vehicle, currentId)) return;

  const previousVehicles = vehicles;
  if (currentId) {
    vehicles = vehicles.map(item => item.id === currentId
      ? { ...item, ...vehicle, id: currentId, actualizado: new Date().toISOString() }
      : item
    );
  } else {
    vehicles = [...vehicles, { ...vehicle, id: createId(), creado: new Date().toISOString() }];
  }

  if (!saveVehicles()) {
    vehicles = previousVehicles;
    return;
  }

  renderVehicles();
  resetFormState();
  alert(currentId ? 'Vehículo actualizado correctamente.' : 'Vehículo registrado correctamente.');
});

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

clearButton.addEventListener('click', () => {
  resetFormState();
});

form.addEventListener('reset', () => {
  // Permite que el reset nativo termine antes de quitar el modo edición.
  setTimeout(() => {
    selectedImageData = '';
    selectedImageUrl = '';
    editingOriginalImage = '';
    imageUrlInput.value = '';
    imageInput.value = '';
    showImagePreview('');
    editingIdInput.value = '';
    submitButton.textContent = 'Registrar vehículo';
    document.querySelector('#registro h2').textContent = 'Datos del vehículo';
  }, 0);
});

imageInput.addEventListener('change', () => {
  const file = imageInput.files && imageInput.files[0];
  if (!file) {
    selectedImageData = '';
    showImagePreview(selectedImageUrl || editingOriginalImage);
    return;
  }
  if (!file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen válido.');
    imageInput.value = '';
    return;
  }
  if (file.size > 1024 * 1024) {
    alert('La imagen supera 1 MB. Elige una fotografía más pequeña para no llenar el almacenamiento del navegador.');
    imageInput.value = '';
    return;
  }
  imageUrlInput.value = '';
  selectedImageUrl = '';
  const reader = new FileReader();
  reader.onload = () => {
    selectedImageData = String(reader.result || '');
    showImagePreview(selectedImageData);
  };
  reader.onerror = () => alert('No se pudo leer la imagen seleccionada.');
  reader.readAsDataURL(file);
});

imageUrlInput.addEventListener('input', () => {
  imageUrlInput.setCustomValidity('');
  const url = imageUrlInput.value.trim();
  selectedImageData = '';
  imageInput.value = '';
  selectedImageUrl = '';
  if (!url) {
    showImagePreview(editingOriginalImage);
    return;
  }
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Protocolo no válido');
    selectedImageUrl = parsed.href;
    showImagePreview(selectedImageUrl);
  } catch {
    showImagePreview('');
  }
});

imagePreview.addEventListener('error', () => {
  if (imagePreview.src) {
    imagePreview.removeAttribute('src');
    imagePreviewWrap.hidden = true;
    selectedImageUrl = '';
    if (imageUrlInput.value.trim()) {
      imageUrlInput.setCustomValidity('No se pudo cargar esa imagen. Usa un enlace directo y público a un archivo JPG, PNG o WEBP.');
      imageUrlInput.reportValidity();
      imageUrlInput.setCustomValidity('');
    }
  }
});

removeImageButton.addEventListener('click', () => {
  selectedImageData = '';
  selectedImageUrl = '';
  editingOriginalImage = '';
  imageInput.value = '';
  imageUrlInput.value = '';
  showImagePreview('');
});

searchInput.addEventListener('input', renderVehicles);
footerYear.textContent = String(new Date().getFullYear());
yearInput.max = String(new Date().getFullYear() + 1);
renderVehicles();
